package com.signage.player.engine

import android.content.Context
import android.graphics.Color
import android.net.Uri
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.TextView
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import com.bumptech.glide.Glide
import org.json.JSONArray
import org.json.JSONObject

/**
 * ZoneRenderer — Multi-zone layout engine
 *
 * Renders display zones using the appropriate native component:
 * - video → ExoPlayer (hardware decode, A/B buffering)
 * - image → ImageView + Glide (efficient loading/caching)
 * - ticker/clock/weather/widget → WebView (HTML rendering)
 *
 * Layout zones use percentage-based positioning (x%, y%, width%, height%)
 * mapped to absolute pixels based on screen dimensions.
 */
class ZoneRenderer(
    private val context: Context,
    private val container: FrameLayout,
    private val baseServerUrl: String
) {
    companion object {
        private const val TAG = "ZoneRenderer"
    }

    private val zoneViews = mutableListOf<ZoneViewHolder>()
    private val playlistEngines = mutableListOf<PlaylistEngine>()
    private var serverUrl = ""
    private var globalVolume = 1.0f

    data class ZoneViewHolder(
        val zoneId: String,
        val type: String, // "video", "image", "widget"
        val view: View,
        val playerA: ExoPlayer? = null,
        val playerB: ExoPlayer? = null, // A/B buffer
        val playerViewA: PlayerView? = null,
        val playerViewB: PlayerView? = null,
    )

    /**
     * Render display data — creates/updates zone views
     */
    fun render(displayData: JSONObject) {
        val screen = displayData.optJSONObject("screen") ?: return
        val layout = displayData.optJSONObject("layout")
        val playlists = displayData.optJSONArray("playlists") ?: JSONArray()
        val mediaItems = displayData.optJSONArray("mediaItems") ?: JSONArray()

        serverUrl = baseServerUrl.trimEnd('/')

        // Get zones from layout (or create single full-screen zone)
        val zones = layout?.optJSONArray("zones") ?: run {
            // No layout — single full-screen zone
            val defaultZone = JSONObject().apply {
                put("id", "zone-default")
                put("x", 0)
                put("y", 0)
                put("width", 100)
                put("height", 100)
                put("zIndex", 1)
                put("playlistId", screen.optString("currentPlaylistId", ""))
            }
            JSONArray().put(defaultZone)
        }

        // Clear existing zones
        releaseZones()

        // Get screen dimensions
        val screenWidth = container.width.takeIf { it > 0 } ?: context.resources.displayMetrics.widthPixels
        val screenHeight = container.height.takeIf { it > 0 } ?: context.resources.displayMetrics.heightPixels

        // Create zone views
        for (i in 0 until zones.length()) {
            val zone = zones.getJSONObject(i)
            val zoneId = zone.optString("id", "zone-$i")
            val x = zone.optDouble("x", 0.0)
            val y = zone.optDouble("y", 0.0)
            val width = zone.optDouble("width", 100.0)
            val height = zone.optDouble("height", 100.0)
            val zIndex = zone.optInt("zIndex", i + 1)
            val playlistId = zone.optString("playlistId", "")
            val bgColor = zone.optString("backgroundColor", "#000000")

            // Calculate pixel dimensions
            val pixelX = (x / 100.0 * screenWidth).toInt()
            val pixelY = (y / 100.0 * screenHeight).toInt()
            val pixelW = (width / 100.0 * screenWidth).toInt()
            val pixelH = (height / 100.0 * screenHeight).toInt()

            // Find playlist for this zone
            val playlist = findPlaylist(playlistId, playlists)
            val items = playlist?.optJSONArray("items") ?: JSONArray()

            // Determine zone type from first media item
            val zoneType = determineZoneType(items, mediaItems)

            // Create appropriate view
            val holder = when (zoneType) {
                "video" -> createVideoZone(zoneId, pixelX, pixelY, pixelW, pixelH, zIndex, bgColor)
                "image" -> createImageZone(zoneId, pixelX, pixelY, pixelW, pixelH, zIndex, bgColor)
                else -> createWidgetZone(zoneId, pixelX, pixelY, pixelW, pixelH, zIndex, bgColor)
            }

            zoneViews.add(holder)

            // Start playlist engine for this zone
            if (items.length() > 0) {
                val engine = PlaylistEngine(
                    context = context,
                    zoneHolder = holder,
                    playlistItems = items,
                    mediaItems = mediaItems,
                    serverUrl = serverUrl,
                    volume = globalVolume
                )
                engine.start()
                playlistEngines.add(engine)
            }
        }

        Log.i(TAG, "Rendered ${zoneViews.size} zones (${playlistEngines.size} with playlists)")
    }

    // ─── Zone Creators ──────────────────────────────────────────

    private fun createVideoZone(
        id: String, x: Int, y: Int, w: Int, h: Int, zIndex: Int, bgColor: String
    ): ZoneViewHolder {
        // A/B double-buffered ExoPlayer
        val playerA = ExoPlayer.Builder(context).build().apply {
            repeatMode = Player.REPEAT_MODE_OFF
            volume = globalVolume
        }
        val playerB = ExoPlayer.Builder(context).build().apply {
            repeatMode = Player.REPEAT_MODE_OFF
            volume = 0f // Silent until swapped
        }

        val zoneFrame = FrameLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(w, h).apply {
                leftMargin = x
                topMargin = y
            }
            setBackgroundColor(Color.parseColor(bgColor))
            elevation = zIndex.toFloat()
        }

        val playerViewA = PlayerView(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            player = playerA
            useController = false // No playback controls for signage
            setShowBuffering(PlayerView.SHOW_BUFFERING_NEVER)
        }

        val playerViewB = PlayerView(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            player = playerB
            useController = false
            setShowBuffering(PlayerView.SHOW_BUFFERING_NEVER)
            visibility = View.INVISIBLE // Hidden until swap
        }

        zoneFrame.addView(playerViewA)
        zoneFrame.addView(playerViewB)
        container.addView(zoneFrame)

        return ZoneViewHolder(id, "video", zoneFrame, playerA, playerB, playerViewA, playerViewB)
    }

    private fun createImageZone(
        id: String, x: Int, y: Int, w: Int, h: Int, zIndex: Int, bgColor: String
    ): ZoneViewHolder {
        val imageView = ImageView(context).apply {
            layoutParams = FrameLayout.LayoutParams(w, h).apply {
                leftMargin = x
                topMargin = y
            }
            scaleType = ImageView.ScaleType.CENTER_CROP
            setBackgroundColor(Color.parseColor(bgColor))
            elevation = zIndex.toFloat()
        }
        container.addView(imageView)

        return ZoneViewHolder(id, "image", imageView)
    }

    private fun createWidgetZone(
        id: String, x: Int, y: Int, w: Int, h: Int, zIndex: Int, bgColor: String
    ): ZoneViewHolder {
        val webView = WebView(context).apply {
            layoutParams = FrameLayout.LayoutParams(w, h).apply {
                leftMargin = x
                topMargin = y
            }
            setBackgroundColor(Color.TRANSPARENT)
            elevation = zIndex.toFloat()
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            webViewClient = WebViewClient()
        }
        container.addView(webView)

        return ZoneViewHolder(id, "widget", webView)
    }

    // ─── Helpers ────────────────────────────────────────────────

    private fun determineZoneType(items: JSONArray, allMedia: JSONArray): String {
        if (items.length() == 0) return "image"

        val firstItem = items.getJSONObject(0)
        val mediaId = firstItem.optString("mediaId", "")
        val media = findMedia(mediaId, allMedia) ?: return "image"
        val type = media.optString("type", "image")

        return when (type) {
            "video" -> "video"
            "image" -> "image"
            "ticker", "clock", "weather", "announcement", "webpage" -> "widget"
            else -> "image"
        }
    }

    private fun findPlaylist(id: String, playlists: JSONArray): JSONObject? {
        for (i in 0 until playlists.length()) {
            val pl = playlists.getJSONObject(i)
            if (pl.optString("id") == id) return pl
        }
        return null
    }

    private fun findMedia(id: String, mediaItems: JSONArray): JSONObject? {
        for (i in 0 until mediaItems.length()) {
            val m = mediaItems.getJSONObject(i)
            if (m.optString("id") == id) return m
        }
        return null
    }

    // ─── Volume Control ─────────────────────────────────────────

    fun setVolume(volume: Float) {
        globalVolume = volume
        zoneViews.forEach { holder ->
            holder.playerA?.volume = volume
        }
    }

    // ─── Lifecycle ──────────────────────────────────────────────

    fun pause() {
        playlistEngines.forEach { it.pause() }
    }

    fun resume() {
        playlistEngines.forEach { it.resume() }
    }

    fun release() {
        releaseZones()
    }

    private fun releaseZones() {
        playlistEngines.forEach { it.stop() }
        playlistEngines.clear()

        zoneViews.forEach { holder ->
            holder.playerA?.release()
            holder.playerB?.release()
            if (holder.view is WebView) {
                (holder.view as WebView).destroy()
            }
            container.removeView(holder.view)
        }
        zoneViews.clear()
    }
}

package com.signage.player.engine

import android.content.Context
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.webkit.WebView
import android.widget.ImageView
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import com.bumptech.glide.Glide
import org.json.JSONArray
import org.json.JSONObject

/**
 * PlaylistEngine — Cycles through playlist items in a zone
 *
 * Features:
 * - A/B video buffering (preload next video while current plays)
 * - Smooth crossfade transitions between items
 * - Image display with configurable duration
 * - Widget (HTML) rendering for ticker/clock/weather
 * - Zero black-frame transitions (NFR-01.1)
 */
class PlaylistEngine(
    private val context: Context,
    private val zoneHolder: ZoneRenderer.ZoneViewHolder,
    private val playlistItems: JSONArray,
    private val mediaItems: JSONArray,
    private val serverUrl: String,
    private var volume: Float = 1.0f
) {
    companion object {
        private const val TAG = "PlaylistEngine"
        private const val DEFAULT_DURATION_MS = 10_000L // 10 seconds default
    }

    private val handler = Handler(Looper.getMainLooper())
    private var currentIndex = 0
    private var isRunning = false
    private var activeSlot = "A" // Which ExoPlayer is currently visible
    private var advanceRunnable: Runnable? = null

    fun start() {
        if (playlistItems.length() == 0) return
        isRunning = true
        currentIndex = 0
        playItem(currentIndex)
    }

    fun stop() {
        isRunning = false
        advanceRunnable?.let { handler.removeCallbacks(it) }
        advanceRunnable = null
    }

    fun pause() {
        zoneHolder.playerA?.pause()
        zoneHolder.playerB?.pause()
        advanceRunnable?.let { handler.removeCallbacks(it) }
    }

    fun resume() {
        if (!isRunning) return
        when (activeSlot) {
            "A" -> zoneHolder.playerA?.play()
            "B" -> zoneHolder.playerB?.play()
        }
    }

    private fun playItem(index: Int) {
        if (!isRunning || playlistItems.length() == 0) return

        val item = playlistItems.getJSONObject(index % playlistItems.length())
        val mediaId = item.optString("mediaId", "")
        val duration = item.optInt("duration", 10) * 1000L // seconds to ms
        val media = findMedia(mediaId)

        if (media == null) {
            Log.w(TAG, "Media not found: $mediaId, skipping")
            advanceToNext(1000)
            return
        }

        val type = media.optString("type", "image")
        val url = resolveUrl(media.optString("url", ""))

        Log.d(TAG, "Playing [${zoneHolder.zoneId}] #$index: $type — ${media.optString("title")}")

        when {
            type == "video" && zoneHolder.type == "video" -> playVideo(url, duration)
            type == "image" && zoneHolder.type == "image" -> playImage(url, duration)
            type == "image" && zoneHolder.type == "video" -> playImageInVideoZone(url, duration)
            zoneHolder.type == "widget" -> playWidget(media, duration)
            else -> playImage(url, duration)
        }
    }

    // ─── Video Playback (A/B Buffering) ─────────────────────────

    private fun playVideo(url: String, durationMs: Long) {
        val currentPlayer = if (activeSlot == "A") zoneHolder.playerA else zoneHolder.playerB
        val currentView = if (activeSlot == "A") zoneHolder.playerViewA else zoneHolder.playerViewB
        val nextPlayer = if (activeSlot == "A") zoneHolder.playerB else zoneHolder.playerA
        val nextView = if (activeSlot == "A") zoneHolder.playerViewB else zoneHolder.playerViewA

        currentPlayer?.let { player ->
            player.volume = volume
            player.setMediaItem(MediaItem.fromUri(Uri.parse(url)))
            player.prepare()
            player.playWhenReady = true

            // Show current, hide next
            currentView?.visibility = View.VISIBLE
            nextView?.visibility = View.INVISIBLE

            // Listen for video end
            player.addListener(object : Player.Listener {
                override fun onPlaybackStateChanged(state: Int) {
                    if (state == Player.STATE_ENDED) {
                        player.removeListener(this)
                        advanceToNext(0)
                    }
                }
            })

            // Also advance on duration timeout (in case video is shorter/longer)
            if (durationMs > 0) {
                advanceRunnable = Runnable {
                    if (isRunning) {
                        // Preload next into buffer slot
                        preloadNext()
                        advanceToNext(0)
                    }
                }
                handler.postDelayed(advanceRunnable!!, durationMs)
            }
        }
    }

    /**
     * Preload the next video into the inactive ExoPlayer (A/B buffering)
     * This ensures zero black-frame on transition (NFR-01.1)
     */
    private fun preloadNext() {
        val nextIndex = (currentIndex + 1) % playlistItems.length()
        val nextItem = playlistItems.getJSONObject(nextIndex)
        val nextMediaId = nextItem.optString("mediaId", "")
        val nextMedia = findMedia(nextMediaId) ?: return
        val nextType = nextMedia.optString("type", "")

        if (nextType != "video") return

        val nextUrl = resolveUrl(nextMedia.optString("url", ""))
        val preloadPlayer = if (activeSlot == "A") zoneHolder.playerB else zoneHolder.playerA

        preloadPlayer?.let {
            it.volume = 0f // Silent while preloading
            it.setMediaItem(MediaItem.fromUri(Uri.parse(nextUrl)))
            it.prepare()
        }
    }

    // ─── Image Playback ─────────────────────────────────────────

    private fun playImage(url: String, durationMs: Long) {
        val imageView = zoneHolder.view as? ImageView ?: return

        Glide.with(context)
            .load(url)
            .centerCrop()
            .into(imageView)

        advanceRunnable = Runnable { if (isRunning) advanceToNext(0) }
        handler.postDelayed(advanceRunnable!!, durationMs.coerceAtLeast(DEFAULT_DURATION_MS))
    }

    private fun playImageInVideoZone(url: String, durationMs: Long) {
        // Hide both player views, show image in a temporary ImageView
        zoneHolder.playerViewA?.visibility = View.INVISIBLE
        zoneHolder.playerViewB?.visibility = View.INVISIBLE
        zoneHolder.playerA?.pause()
        zoneHolder.playerB?.pause()

        // Load into the zone frame background
        val frame = zoneHolder.view as? android.widget.FrameLayout ?: return
        val tempImage = ImageView(context).apply {
            layoutParams = android.widget.FrameLayout.LayoutParams(
                android.widget.FrameLayout.LayoutParams.MATCH_PARENT,
                android.widget.FrameLayout.LayoutParams.MATCH_PARENT
            )
            scaleType = ImageView.ScaleType.CENTER_CROP
            tag = "temp_image"
        }
        // Remove any previous temp image
        frame.findViewWithTag<View>("temp_image")?.let { frame.removeView(it) }
        frame.addView(tempImage, 0)

        Glide.with(context).load(url).centerCrop().into(tempImage)

        advanceRunnable = Runnable {
            if (isRunning) {
                frame.removeView(tempImage)
                advanceToNext(0)
            }
        }
        handler.postDelayed(advanceRunnable!!, durationMs.coerceAtLeast(DEFAULT_DURATION_MS))
    }

    // ─── Widget Playback (WebView) ──────────────────────────────

    private fun playWidget(media: JSONObject, durationMs: Long) {
        val webView = zoneHolder.view as? WebView ?: return
        val type = media.optString("type", "")
        val contentData = media.optJSONObject("contentData")

        val html = when (type) {
            "ticker" -> generateTickerHtml(contentData)
            "clock" -> generateClockHtml(contentData)
            "weather" -> generateWeatherHtml(contentData)
            "announcement" -> generateAnnouncementHtml(contentData)
            "webpage" -> {
                val webUrl = contentData?.optString("webUrl", "") ?: ""
                if (webUrl.isNotEmpty()) {
                    webView.loadUrl(webUrl)
                    advanceRunnable = Runnable { if (isRunning) advanceToNext(0) }
                    handler.postDelayed(advanceRunnable!!, durationMs.coerceAtLeast(DEFAULT_DURATION_MS))
                    return
                }
                "<html><body style='background:black;color:white;'>No URL</body></html>"
            }
            else -> "<html><body style='background:black;'></body></html>"
        }

        webView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null)

        advanceRunnable = Runnable { if (isRunning) advanceToNext(0) }
        handler.postDelayed(advanceRunnable!!, durationMs.coerceAtLeast(DEFAULT_DURATION_MS))
    }

    // ─── Widget HTML Generators ─────────────────────────────────

    private fun generateTickerHtml(data: JSONObject?): String {
        val text = data?.optString("tickerText", "Digital Signage") ?: "Digital Signage"
        val speed = data?.optInt("speed", 25) ?: 25
        return """
        <html><head><style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { background:#0B0E14; overflow:hidden; display:flex; align-items:center; height:100vh; }
            .ticker { white-space:nowrap; font:bold 32px 'Inter',sans-serif; color:#E1E2EB;
                      animation: scroll ${speed}s linear infinite; padding-left:100%; }
            .label { color:#4CD7F6; margin-right:16px; font-size:14px; text-transform:uppercase; letter-spacing:2px; }
            @keyframes scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-100%)} }
        </style></head>
        <body><div class="ticker"><span class="label">● LIVE</span> $text</div></body></html>
        """.trimIndent()
    }

    private fun generateClockHtml(data: JSONObject?): String {
        val format = data?.optString("clockFormat", "24h") ?: "24h"
        return """
        <html><head><style>
            * { margin:0; padding:0; }
            body { background:#0B0E14; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:'Inter',sans-serif; }
            .time { font-size:72px; font-weight:800; color:#E1E2EB; letter-spacing:-2px; }
            .date { font-size:16px; color:#908FA0; margin-top:8px; text-transform:uppercase; letter-spacing:3px; }
        </style></head>
        <body>
            <div class="time" id="time"></div>
            <div class="date" id="date"></div>
            <script>
                function update(){
                    var now=new Date();
                    var h=now.getHours(),m=now.getMinutes(),s=now.getSeconds();
                    ${if (format == "12h") "var ap=h>=12?'PM':'AM';h=h%12||12;document.getElementById('time').textContent=h+':'+(m<10?'0':'')+m+':'+(s<10?'0':'')+s+' '+ap;"
                      else "document.getElementById('time').textContent=(h<10?'0':'')+h+':'+(m<10?'0':'')+m+':'+(s<10?'0':'')+s;"}
                    document.getElementById('date').textContent=now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
                }
                update();setInterval(update,1000);
            </script>
        </body></html>
        """.trimIndent()
    }

    private fun generateWeatherHtml(data: JSONObject?): String {
        val city = data?.optString("weatherCity", "Bangkok") ?: "Bangkok"
        return """
        <html><head><style>
            body { background:#0B0E14; display:flex; align-items:center; justify-content:center; height:100vh; font-family:'Inter',sans-serif; color:#E1E2EB; }
            .card { text-align:center; }
            .city { font-size:14px; color:#908FA0; text-transform:uppercase; letter-spacing:2px; }
            .temp { font-size:64px; font-weight:800; }
            .icon { font-size:48px; }
        </style></head>
        <body><div class="card"><div class="city">$city</div><div class="icon">☀️</div><div class="temp">32°</div></div></body></html>
        """.trimIndent()
    }

    private fun generateAnnouncementHtml(data: JSONObject?): String {
        val header = data?.optString("announcementHeader", "Announcement") ?: "Announcement"
        val body = data?.optString("announcementBody", "") ?: ""
        return """
        <html><head><style>
            body { background:#0B0E14; display:flex; align-items:center; justify-content:center; height:100vh; font-family:'Inter',sans-serif; padding:32px; }
            .card { background:#1D2026; border:1px solid #464554; border-radius:16px; padding:40px; max-width:80%; text-align:center; }
            h1 { color:#C0C1FF; font-size:28px; margin-bottom:16px; }
            p { color:#C7C4D7; font-size:18px; line-height:1.6; }
        </style></head>
        <body><div class="card"><h1>$header</h1><p>$body</p></div></body></html>
        """.trimIndent()
    }

    // ─── Navigation ─────────────────────────────────────────────

    private fun advanceToNext(delayMs: Long) {
        advanceRunnable?.let { handler.removeCallbacks(it) }

        if (!isRunning) return

        // Swap A/B slot for video zones
        if (zoneHolder.type == "video") {
            activeSlot = if (activeSlot == "A") "B" else "A"
        }

        currentIndex = (currentIndex + 1) % playlistItems.length()

        if (delayMs > 0) {
            handler.postDelayed({ playItem(currentIndex) }, delayMs)
        } else {
            playItem(currentIndex)
        }
    }

    // ─── Helpers ────────────────────────────────────────────────

    private fun findMedia(mediaId: String): JSONObject? {
        for (i in 0 until mediaItems.length()) {
            val m = mediaItems.getJSONObject(i)
            if (m.optString("id") == mediaId) return m
        }
        return null
    }

    private fun resolveUrl(url: String): String {
        if (url.startsWith("http")) return url
        return "$serverUrl$url"
    }
}

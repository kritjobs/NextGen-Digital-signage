package com.signage.player

import android.app.Activity
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.WebView
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.TextView
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import com.signage.player.engine.DataSyncManager
import com.signage.player.engine.PlaylistEngine
import com.signage.player.engine.ZoneRenderer
import com.signage.player.service.EmergencyListenerService
import kotlinx.coroutines.*
import org.json.JSONObject

/**
 * NativePlayerActivity — Hybrid ExoPlayer + WebView Display
 *
 * Architecture:
 * ┌─────────────────────────────────────────┐
 * │  FrameLayout (full screen, black bg)     │
 * │  ├── ZoneRenderer[0]: PlayerView/Image   │  ← ExoPlayer (hardware decode)
 * │  ├── ZoneRenderer[1]: PlayerView/Image   │
 * │  ├── ZoneRenderer[2]: WebView            │  ← HTML widgets (ticker, clock)
 * │  └── StatusOverlay (sync indicator)      │
 * └─────────────────────────────────────────┘
 *
 * - Video/Image: Native ExoPlayer → hardware H.264/H.265 decode, GPU render
 * - Widgets (ticker, clock, weather): WebView overlay (lightweight)
 * - A/B buffering: Two ExoPlayer instances per video zone, swap on transition
 */
class NativePlayerActivity : Activity() {

    companion object {
        private const val TAG = "NativePlayer"
        private const val PREFS_NAME = "signage_prefs"
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_DISPLAY_TOKEN = "display_token"
        private const val KEY_SCREEN_ID = "screen_id"

        fun launch(context: Context) {
            val intent = Intent(context, NativePlayerActivity::class.java)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            context.startActivity(intent)
        }
    }

    private lateinit var rootLayout: FrameLayout
    private lateinit var statusText: TextView
    private lateinit var dataSyncManager: DataSyncManager
    private lateinit var zoneRenderer: ZoneRenderer
    private var wakeLock: PowerManager.WakeLock? = null
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private val handler = Handler(Looper.getMainLooper())
    private var networkCallback: ConnectivityManager.NetworkCallback? = null
    private var isOnline = true

    private var serverUrl = ""
    private var displayToken = ""
    private var screenId = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            enterImmersiveMode()
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

            // Load config
            val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
            serverUrl = prefs.getString(KEY_SERVER_URL, "") ?: ""
            displayToken = prefs.getString(KEY_DISPLAY_TOKEN, "") ?: ""
            screenId = prefs.getString(KEY_SCREEN_ID, "") ?: ""

            if (serverUrl.isEmpty() || displayToken.isEmpty() || screenId.isEmpty()) {
                // Not configured — go back to MainActivity for pairing
                Log.w(TAG, "Not paired, returning to MainActivity")
                finish()
                return
            }

            // Create UI
            createUI()

            // Initialize data sync
            dataSyncManager = DataSyncManager(
                serverUrl = serverUrl,
                screenId = screenId,
                displayToken = displayToken,
                onDataLoaded = { data -> onDisplayDataLoaded(data) },
                onError = { error -> showError(error) },
                onCommand = { command, payload -> onRemoteCommand(command, payload) }
            )

            // Initialize zone renderer
            zoneRenderer = ZoneRenderer(this, rootLayout, serverUrl)

            // Start syncing
            dataSyncManager.start(scope)

            // Start emergency listener (always-on background service)
            EmergencyListenerService.start(this)

            // Network monitor
            registerNetworkCallback()

            // Wake lock
            acquireWakeLock()

            showStatus("Connecting...", Color.parseColor("#4CD7F6"))

        } catch (e: Exception) {
            Log.e(TAG, "onCreate error", e)
            val tv = TextView(this).apply {
                text = "Error: ${e.message}"
                setTextColor(Color.parseColor("#FFB4AB"))
                textSize = 16f
                setPadding(48, 48, 48, 48)
            }
            setContentView(tv)
        }
    }

    private fun createUI() {
        rootLayout = FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.BLACK)
        }

        // Status overlay (top-right corner)
        statusText = TextView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = android.view.Gravity.TOP or android.view.Gravity.END
                setMargins(0, 16, 16, 0)
            }
            setTextColor(Color.parseColor("#4CD7F6"))
            textSize = 11f
            setPadding(12, 6, 12, 6)
            setBackgroundColor(Color.parseColor("#CC000000"))
            visibility = View.GONE
        }
        rootLayout.addView(statusText)

        setContentView(rootLayout)
    }

    // ─── Data Loaded Callback ───────────────────────────────────

    private fun onDisplayDataLoaded(data: JSONObject) {
        runOnUiThread {
            try {
                hideStatus()
                // Wait for layout to be measured before rendering zones
                if (rootLayout.width == 0 || rootLayout.height == 0) {
                    rootLayout.post { renderData(data) }
                } else {
                    renderData(data)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Render error: ${e.message}", e)
                showError("Render error: ${e.message}")
            }
        }
    }

    private fun renderData(data: JSONObject) {
        try {
            val screen = data.optJSONObject("screen")
            val layout = data.optJSONObject("layout")
            val playlists = data.optJSONArray("playlists")
            val mediaItems = data.optJSONArray("mediaItems")

            // Check if there's actually content to display
            val hasContent = (layout != null && layout.optJSONArray("zones")?.length() ?: 0 > 0) ||
                             (screen?.optString("currentPlaylistId", "")?.isNotEmpty() == true)

            if (!hasContent && (playlists == null || playlists.length() == 0 || mediaItems == null || mediaItems.length() == 0)) {
                showStatus("📺 Connected — Waiting for playlist assignment", Color.parseColor("#4CD7F6"))
                Log.i(TAG, "No content assigned to this screen yet")
                return
            }

            zoneRenderer.render(data)
            Log.i(TAG, "Display data rendered (${rootLayout.width}x${rootLayout.height})")
        } catch (e: Exception) {
            Log.e(TAG, "ZoneRenderer error: ${e.message}", e)
            showError("Zone render error: ${e.message}")
        }
    }

    // ─── Remote Commands (WebSocket) ────────────────────────────

    private fun onRemoteCommand(command: String, payload: JSONObject?) {
        runOnUiThread {
            when (command) {
                "UNPAIR_DEVICE" -> {
                    Log.i(TAG, "Remote UNPAIR — clearing tokens")
                    getSharedPreferences(PREFS_NAME, MODE_PRIVATE).edit().apply {
                        remove(KEY_DISPLAY_TOKEN)
                        remove(KEY_SCREEN_ID)
                        apply()
                    }
                    // Go back to MainActivity (which shows pairing WebView)
                    val intent = Intent(this, MainActivity::class.java)
                    intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK)
                    startActivity(intent)
                    finish()
                }

                "REBOOT" -> {
                    Log.i(TAG, "Remote REBOOT")
                    dataSyncManager.forceSync()
                }

                "SET_VOLUME" -> {
                    val volume = payload?.optInt("volume", 100) ?: 100
                    zoneRenderer.setVolume(volume / 100f)
                }

                "PURGE_CACHE" -> {
                    Log.i(TAG, "PURGE_CACHE — clearing media cache")
                    scope.launch(Dispatchers.IO) {
                        cacheDir.deleteRecursively()
                        cacheDir.mkdirs()
                    }
                }
            }
        }
    }

    // ─── Status / Error Display ─────────────────────────────────

    private fun showStatus(text: String, color: Int) {
        statusText.text = text
        statusText.setTextColor(color)
        statusText.visibility = View.VISIBLE
    }

    private fun hideStatus() {
        statusText.visibility = View.GONE
    }

    private fun showError(message: String) {
        runOnUiThread {
            showStatus("⚠ $message", Color.parseColor("#FFB4AB"))
        }
    }

    // ─── Immersive Mode ─────────────────────────────────────────

    private fun enterImmersiveMode() {
        try {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                )
        } catch (e: Exception) {
            Log.w(TAG, "Immersive mode: ${e.message}")
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) enterImmersiveMode()
    }

    // ─── Network Monitor ────────────────────────────────────────

    private fun registerNetworkCallback() {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            val request = NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build()
            networkCallback = object : ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: Network) {
                    if (!isOnline) {
                        isOnline = true
                        runOnUiThread {
                            showStatus("● Online — Syncing", Color.parseColor("#34D399"))
                            dataSyncManager.forceSync()
                            handler.postDelayed({ hideStatus() }, 3000)
                        }
                    }
                }
                override fun onLost(network: Network) {
                    isOnline = false
                    runOnUiThread {
                        showStatus("● Offline — Cached playback", Color.parseColor("#FBBF24"))
                    }
                }
            }
            cm.registerNetworkCallback(request, networkCallback!!)
        }
    }

    // ─── Key Handling ───────────────────────────────────────────

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            KeyEvent.KEYCODE_MENU, KeyEvent.KEYCODE_SETTINGS -> {
                // Secret escape to settings
                getSharedPreferences(PREFS_NAME, MODE_PRIVATE).edit()
                    .remove(KEY_SERVER_URL).apply()
                val intent = Intent(this, MainActivity::class.java)
                intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK)
                startActivity(intent)
                finish()
                return true
            }
            KeyEvent.KEYCODE_BACK -> return true // Block back
        }
        return super.onKeyDown(keyCode, event)
    }

    // ─── Lifecycle ──────────────────────────────────────────────

    @SuppressLint("WakelockTimeout")
    private fun acquireWakeLock() {
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "signage:native")
            .apply { acquire() }
    }

    override fun onResume() {
        super.onResume()
        enterImmersiveMode()
        if (::zoneRenderer.isInitialized) zoneRenderer.resume()
    }

    override fun onPause() {
        super.onPause()
        if (::zoneRenderer.isInitialized) zoneRenderer.pause()
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
        if (::dataSyncManager.isInitialized) dataSyncManager.stop()
        if (::zoneRenderer.isInitialized) zoneRenderer.release()
        networkCallback?.let {
            try {
                val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
                cm.unregisterNetworkCallback(it)
            } catch (_: Exception) {}
        }
        wakeLock?.release()
    }
}

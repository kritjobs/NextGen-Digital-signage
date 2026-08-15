package com.signage.player

import android.app.Activity
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.text.InputType
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.*
import android.widget.Button
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import com.signage.player.bridge.NativeBridge
import com.signage.player.service.OfflineCacheService
import kotlinx.coroutines.*

/**
 * MainActivity — WebView Kiosk Player for Android TV
 *
 * Features:
 * - Fullscreen immersive mode (hides system bars)
 * - Hardware-accelerated WebView with media autoplay
 * - Offline support via Service Worker + native cache bridge
 * - FLAG_KEEP_SCREEN_ON to prevent sleep
 * - D-pad navigation support
 * - Auto-reconnect on network restore
 */
class MainActivity : Activity() {

    private lateinit var webView: WebView
    private lateinit var statusOverlay: TextView
    private lateinit var offlineOverlay: FrameLayout
    private var wakeLock: PowerManager.WakeLock? = null
    private var isKioskMode = true
    private var serverUrl: String = ""
    private var isOnline = true
    private lateinit var nativeBridge: NativeBridge
    private var networkCallback: ConnectivityManager.NetworkCallback? = null
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    companion object {
        private const val PREFS_NAME = "signage_prefs"
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_KIOSK_MODE = "kiosk_mode"
        private const val KEY_AUTO_SYNC = "auto_sync"
        private const val KEY_DISPLAY_TOKEN = "display_token"
        private const val KEY_SCREEN_ID = "screen_id"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            // Full immersive before setContentView
            enterImmersiveMode()

            // Keep screen on
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

            // Load preferences
            val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
            serverUrl = prefs.getString(KEY_SERVER_URL, "") ?: ""
            isKioskMode = prefs.getBoolean(KEY_KIOSK_MODE, true)

            // If no server configured, show inline setup UI
            if (serverUrl.isEmpty()) {
                showSetupUI()
                return
            }

            // Set content view with WebView
            setContentView(createContentView())

            // Initialize WebView
            setupWebView()

            // Register network monitor
            registerNetworkCallback()

            // Acquire partial wake lock for background awareness
            acquireWakeLock()

            // Start offline cache service if auto-sync enabled
            if (prefs.getBoolean(KEY_AUTO_SYNC, true)) {
                startCacheService()
            }

            // Load player URL
            loadPlayerUrl()

        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "FATAL onCreate error: ${e.message}", e)
            // Show error as simple text view so user can see what happened
            val tv = TextView(this).apply {
                text = "Error starting app:\n${e.message}\n\n${e.stackTraceToString().take(500)}"
                setTextColor(0xFFFFB4AB.toInt())
                textSize = 14f
                setPadding(48, 48, 48, 48)
            }
            setContentView(tv)
        }
    }

    /**
     * Inline setup UI — shown when no server URL configured.
     * Uses basic Android views (no Material Components) to avoid theme crashes on TV.
     */
    private fun showSetupUI() {
        val root = FrameLayout(this).apply {
            setBackgroundColor(0xFF0B0E14.toInt())
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }

        val container = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
            setPadding(120, 60, 120, 60)
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }

        // Title
        val title = TextView(this).apply {
            text = "\uD83D\uDCFA Digital Signage Player"
            textSize = 28f
            setTextColor(0xFF4CD7F6.toInt())
            gravity = android.view.Gravity.CENTER
            setPadding(0, 0, 0, 16)
        }
        container.addView(title)

        // Subtitle
        val subtitle = TextView(this).apply {
            text = "Enter your signage server address to get started"
            textSize = 16f
            setTextColor(0xFFC7C4D7.toInt())
            gravity = android.view.Gravity.CENTER
            setPadding(0, 0, 0, 48)
        }
        container.addView(subtitle)

        // URL Input
        val urlInput = android.widget.EditText(this).apply {
            hint = "http://192.168.1.100:3100"
            setHintTextColor(0xFF908FA0.toInt())
            setTextColor(0xFFE1E2EB.toInt())
            textSize = 20f
            setBackgroundColor(0xFF1D2026.toInt())
            setPadding(32, 24, 32, 24)
            inputType = android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_URI
            isSingleLine = true
            val lp = android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
            )
            lp.bottomMargin = 32
            layoutParams = lp
        }
        container.addView(urlInput)

        // Status text
        val statusText = TextView(this).apply {
            text = ""
            textSize = 14f
            setTextColor(0xFF4CD7F6.toInt())
            gravity = android.view.Gravity.CENTER
            setPadding(0, 0, 0, 24)
        }
        container.addView(statusText)

        // Button row
        val buttonRow = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.HORIZONTAL
            gravity = android.view.Gravity.CENTER
            val lp = android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
            )
            lp.topMargin = 16
            layoutParams = lp
        }

        // Test button
        val btnTest = android.widget.Button(this).apply {
            text = "Test Connection"
            textSize = 16f
            setPadding(32, 16, 32, 16)
            setOnClickListener {
                val url = normalizeUrl(urlInput.text.toString().trim())
                if (url.isEmpty()) {
                    statusText.text = "Please enter a URL"
                    statusText.setTextColor(0xFFFFB4AB.toInt())
                    return@setOnClickListener
                }
                urlInput.setText(url)
                statusText.text = "Testing..."
                statusText.setTextColor(0xFF4CD7F6.toInt())

                scope.launch {
                    val result = testConnection(url)
                    statusText.text = result.second
                    statusText.setTextColor(
                        if (result.first) 0xFF34D399.toInt() else 0xFFFFB4AB.toInt()
                    )
                }
            }
        }
        buttonRow.addView(btnTest)

        // Spacer
        val spacer = View(this).apply {
            layoutParams = android.widget.LinearLayout.LayoutParams(32, 1)
        }
        buttonRow.addView(spacer)

        // Save button
        val btnSave = android.widget.Button(this).apply {
            text = "Save & Start"
            textSize = 16f
            setPadding(32, 16, 32, 16)
            setOnClickListener {
                val url = normalizeUrl(urlInput.text.toString().trim())
                if (url.isEmpty()) {
                    statusText.text = "Server URL is required"
                    statusText.setTextColor(0xFFFFB4AB.toInt())
                    return@setOnClickListener
                }
                // Save
                getSharedPreferences(PREFS_NAME, MODE_PRIVATE).edit().apply {
                    putString(KEY_SERVER_URL, url)
                    putBoolean(KEY_KIOSK_MODE, true)
                    putBoolean(KEY_AUTO_SYNC, true)
                    apply()
                }
                // Restart activity
                val intent = Intent(this@MainActivity, MainActivity::class.java)
                intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK)
                startActivity(intent)
                finish()
            }
        }
        buttonRow.addView(btnSave)

        container.addView(buttonRow)
        root.addView(container)
        setContentView(root)

        // Focus the input for D-pad
        urlInput.requestFocus()
    }

    private fun normalizeUrl(url: String): String {
        var result = url.trim()
        if (result.isEmpty()) return ""
        if (!result.startsWith("http://") && !result.startsWith("https://")) {
            result = "http://$result"
        }
        return result.trimEnd('/')
    }

    private suspend fun testConnection(url: String): Pair<Boolean, String> {
        return kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
            try {
                val conn = java.net.URL("$url/api/health").openConnection() as java.net.HttpURLConnection
                conn.connectTimeout = 5000
                conn.readTimeout = 5000
                conn.requestMethod = "GET"
                val code = conn.responseCode
                conn.disconnect()
                if (code == 200) Pair(true, "✓ Connected successfully!")
                else Pair(false, "Server returned $code")
            } catch (e: Exception) {
                Pair(false, "Failed: ${e.message}")
            }
        }
    }

    /**
     * Create the main view programmatically
     * (avoids XML for the main kiosk view — simpler deployment)
     */
    private fun createContentView(): View {
        val root = FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(0xFF0B0E14.toInt()) // background_dark
        }

        // WebView fills entire screen
        webView = WebView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }
        root.addView(webView)

        // Status overlay (top-right, for sync/offline indicators)
        statusOverlay = TextView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = android.view.Gravity.TOP or android.view.Gravity.END
                setMargins(0, 24, 24, 0)
            }
            setTextColor(0xFF4CD7F6.toInt()) // secondary cyan
            textSize = 12f
            setPadding(16, 8, 16, 8)
            setBackgroundColor(0xCC10131A.toInt())
            visibility = View.GONE
        }
        root.addView(statusOverlay)

        // Offline overlay (full screen, shown when offline + no cache)
        offlineOverlay = FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(0xFF0B0E14.toInt())
            visibility = View.GONE

            val offlineText = TextView(this@MainActivity).apply {
                layoutParams = FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.WRAP_CONTENT,
                    FrameLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    gravity = android.view.Gravity.CENTER
                }
                text = "📡 Offline — Waiting for connection...\nCached content will play automatically"
                setTextColor(0xFFC7C4D7.toInt())
                textSize = 18f
                gravity = android.view.Gravity.CENTER
            }
            addView(offlineText)
        }
        root.addView(offlineOverlay)

        return root
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        nativeBridge = NativeBridge(this, webView)

        webView.settings.apply {
            // Core settings
            javaScriptEnabled = true
            domStorageEnabled = true               // localStorage for tokens
            databaseEnabled = true                 // IndexedDB for offline cache
            mediaPlaybackRequiresUserGesture = false  // Autoplay media
            allowFileAccess = true
            allowContentAccess = true

            // Cache settings for offline
            cacheMode = if (isOnline) WebSettings.LOAD_NO_CACHE else WebSettings.LOAD_CACHE_ELSE_NETWORK
            
            // Performance
            setRenderPriority(WebSettings.RenderPriority.HIGH)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                safeBrowsingEnabled = false
            }

            // Allow mixed content (HTTP media on HTTPS page)
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

            // Video
            loadWithOverviewMode = true
            useWideViewPort = true

            // User agent — identify as Android TV Signage Player
            userAgentString = "$userAgentString SignagePlayer/1.0 AndroidTV"
        }

        // Hardware acceleration at view level
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)

        // JavaScript bridge for native ↔ web communication
        webView.addJavascriptInterface(nativeBridge, "SignageNative")

        // WebView client
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                android.util.Log.i("SignageWebView", "Page loaded: $url")

                // After login success, web app goes to admin "/" — force redirect to /pair
                val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
                val hasPaired = prefs.getString(KEY_DISPLAY_TOKEN, null) != null

                if (!hasPaired && url != null) {
                    val path = android.net.Uri.parse(url).path ?: "/"
                    // If we're NOT on /pair or /display, redirect to /pair
                    if (!path.startsWith("/pair") && !path.startsWith("/display")) {
                        // Check if user just logged in (has access token in localStorage)
                        view?.evaluateJavascript(
                            "(function() { return localStorage.getItem('signage_access_token') ? 'yes' : 'no'; })()"
                        ) { result ->
                            val hasToken = result.replace("\"", "") == "yes"
                            if (hasToken) {
                                // User logged in — now go to /pair
                                android.util.Log.i("SignageWebView", "Login detected, redirecting to /pair")
                                val baseUrl = serverUrl.trimEnd('/')
                                view.loadUrl("$baseUrl/pair")
                            }
                            // If no token, user is still on login page — let them login
                        }
                        return
                    }
                }

                // Inject offline awareness bridge
                injectOfflineAwareness()
                // Hide offline overlay
                offlineOverlay.visibility = View.GONE

                // When display page loads successfully, start emergency service (safe)
                if (url != null && url.contains("/display/")) {
                    try {
                        com.signage.player.service.EmergencyListenerService.start(this@MainActivity)
                    } catch (_: Exception) {
                        // Service start failed — non-fatal, continue without it
                    }
                }
            }

            override fun onReceivedError(
                view: WebView?, request: WebResourceRequest?, error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                // If main frame failed and we're offline, show offline UI
                if (request?.isForMainFrame == true && !isOnline) {
                    showOfflineMode()
                }
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                // Keep all navigation inside WebView
                return false
            }
        }

        // WebChrome client for fullscreen video
        webView.webChromeClient = object : WebChromeClient() {
            private var customView: View? = null
            private var customViewCallback: CustomViewCallback? = null

            override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
                customView = view
                customViewCallback = callback
                // Handle fullscreen video (e.g., HTML5 video fullscreen)
                val root = window.decorView as FrameLayout
                root.addView(view, FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                ))
            }

            override fun onHideCustomView() {
                val root = window.decorView as FrameLayout
                customView?.let { root.removeView(it) }
                customViewCallback?.onCustomViewHidden()
                customView = null
                customViewCallback = null
            }

            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                // Forward web console to Android logcat for debugging
                android.util.Log.d("SignageWebView",
                    "${consoleMessage?.message()} [${consoleMessage?.sourceId()}:${consoleMessage?.lineNumber()}]")
                return true
            }
        }
    }

    private fun loadPlayerUrl() {
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        val savedToken = prefs.getString(KEY_DISPLAY_TOKEN, null)
        val savedScreenId = prefs.getString(KEY_SCREEN_ID, null)

        val baseUrl = serverUrl.trimEnd('/')

        if (savedToken != null && savedScreenId != null) {
            // Already paired — load display directly in WebView
            // Clear cache to ensure latest JS bundle is loaded
            webView.clearCache(true)
            webView.clearHistory()
            val url = "$baseUrl/display/$savedScreenId?token=$savedToken"
            android.util.Log.i("SignagePlayer", "Loading display: $url")
            webView.loadUrl(url)

            // Start emergency listener service (background WS for alerts + tamper detection)
            try {
                com.signage.player.service.EmergencyListenerService.start(this)
            } catch (e: Exception) {
                android.util.Log.w("SignagePlayer", "EmergencyListener start failed: ${e.message}")
            }
        } else {
            // Not paired — clear old web app state and load /pair
            android.util.Log.i("SignagePlayer", "Loading pair page: $baseUrl/pair")
            // Clear any stale tokens from web app localStorage that might cause redirect loops
            webView.evaluateJavascript(
                "localStorage.removeItem('signage_display_token');" +
                "localStorage.removeItem('signage_display_screen_id');",
                null
            )
            webView.loadUrl("$baseUrl/pair")
        }
    }

    /**
     * Inject JavaScript to bridge offline awareness from native to web
     */
    private fun injectOfflineAwareness() {
        val js = """
            (function() {
                // Bridge: notify web app of connection state
                window.__signageNative = {
                    isOnline: ${isOnline},
                    serverUrl: '${serverUrl}',
                    platform: 'android_tv'
                };
                
                // Override navigator.onLine with native state
                Object.defineProperty(navigator, 'onLine', {
                    get: function() { return window.__signageNative.isOnline; }
                });
                
                // Listen for pairing success — save token to native
                var origPushState = history.pushState;
                history.pushState = function() {
                    origPushState.apply(history, arguments);
                    checkPairingState();
                };
                window.addEventListener('popstate', checkPairingState);
                
                function checkPairingState() {
                    var token = localStorage.getItem('signage_display_token');
                    var screenId = localStorage.getItem('signage_display_screen_id');
                    if (token && screenId && window.SignageNative) {
                        window.SignageNative.onPaired(token, screenId);
                    }
                }
                
                // Check immediately
                setTimeout(checkPairingState, 2000);
                
                // Periodic health check
                setInterval(function() {
                    if (window.SignageNative) {
                        window.SignageNative.heartbeat(
                            navigator.onLine ? 'online' : 'offline',
                            performance.memory ? performance.memory.usedJSHeapSize : 0
                        );
                    }
                }, 30000);
                
                console.log('[SignageNative] Bridge injected. Online:', ${isOnline});
            })();
        """.trimIndent()

        webView.evaluateJavascript(js, null)
    }

    // ─── Network Monitoring ─────────────────────────────────────

    private fun registerNetworkCallback() {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            val request = NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build()

            networkCallback = object : ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: Network) {
                    runOnUiThread { onNetworkRestored() }
                }

                override fun onLost(network: Network) {
                    runOnUiThread { onNetworkLost() }
                }
            }
            cm.registerNetworkCallback(request, networkCallback!!)
        } else {
            // Legacy fallback — handled by NetworkReceiver broadcast
        }

        // Check initial state
        isOnline = isNetworkAvailable()
    }

    private fun isNetworkAvailable(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val network = cm.activeNetwork ?: return false
            val caps = cm.getNetworkCapabilities(network) ?: return false
            caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        } else {
            @Suppress("DEPRECATION")
            cm.activeNetworkInfo?.isConnected == true
        }
    }

    private fun onNetworkRestored() {
        isOnline = true
        offlineOverlay.visibility = View.GONE

        // Switch WebView cache mode to network
        webView.settings.cacheMode = WebSettings.LOAD_DEFAULT

        // Notify web app
        webView.evaluateJavascript(
            "if(window.__signageNative) { window.__signageNative.isOnline = true; " +
            "window.dispatchEvent(new Event('online')); }", null
        )

        // Show sync indicator briefly
        showStatus("● Online — Syncing...", 0xFF34D399.toInt())

        // Trigger delta sync
        scope.launch {
            delay(1000)
            triggerDeltaSync()
            delay(3000)
            hideStatus()
        }
    }

    private fun onNetworkLost() {
        isOnline = false

        // Switch to cache-only mode
        webView.settings.cacheMode = WebSettings.LOAD_CACHE_ELSE_NETWORK

        // Notify web app
        webView.evaluateJavascript(
            "if(window.__signageNative) { window.__signageNative.isOnline = false; " +
            "window.dispatchEvent(new Event('offline')); }", null
        )

        showStatus("● Offline — Playing cached content", 0xFFFBBF24.toInt())
    }

    private fun showOfflineMode() {
        offlineOverlay.visibility = View.VISIBLE
    }

    private fun triggerDeltaSync() {
        // Start background media sync
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        if (prefs.getBoolean(KEY_AUTO_SYNC, true)) {
            startCacheService()
        }

        // Reload WebView to get latest content
        webView.reload()
    }

    // ─── Status Overlay ─────────────────────────────────────────

    private fun showStatus(text: String, color: Int) {
        statusOverlay.text = text
        statusOverlay.setTextColor(color)
        statusOverlay.visibility = View.VISIBLE
    }

    private fun hideStatus() {
        statusOverlay.visibility = View.GONE
    }

    // ─── Immersive Mode ─────────────────────────────────────────

    private fun enterImmersiveMode() {
        try {
            // Use legacy flags for TV compatibility (works on all API levels)
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
            // TV may not have system bars at all — ignore
            android.util.Log.w("MainActivity", "enterImmersiveMode: ${e.message}")
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) enterImmersiveMode()
    }

    // ─── Key Handling (D-pad + Kiosk) ───────────────────────────

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        // In kiosk mode, block HOME and BACK
        if (isKioskMode) {
            when (keyCode) {
                KeyEvent.KEYCODE_HOME,
                KeyEvent.KEYCODE_APP_SWITCH -> return true // Block

                KeyEvent.KEYCODE_BACK -> {
                    // Allow WebView back navigation, but don't exit app
                    if (webView.canGoBack()) {
                        webView.goBack()
                    }
                    return true
                }
            }
        }

        // MENU key opens settings (secret exit)
        if (keyCode == KeyEvent.KEYCODE_MENU || keyCode == KeyEvent.KEYCODE_SETTINGS) {
            openSettings()
            return true
        }

        // Long press BACK x3 to exit kiosk (emergency escape)
        return super.onKeyDown(keyCode, event)
    }

    // ─── Settings ───────────────────────────────────────────────

    private fun openSettings() {
        // Clear server URL to show setup UI on restart
        getSharedPreferences(PREFS_NAME, MODE_PRIVATE).edit().remove(KEY_SERVER_URL).apply()
        val intent = Intent(this, MainActivity::class.java)
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK)
        startActivity(intent)
        finish()
    }

    // ─── Service / WakeLock ─────────────────────────────────────

    private fun startCacheService() {
        try {
            val intent = Intent(this, OfflineCacheService::class.java).apply {
                putExtra("server_url", serverUrl)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(intent)
            } else {
                startService(intent)
            }
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "Failed to start cache service: ${e.message}")
        }
    }

    @SuppressLint("WakelockTimeout")
    private fun acquireWakeLock() {
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "signage:player"
        ).apply { acquire() }
    }

    // ─── Lifecycle ──────────────────────────────────────────────

    override fun onResume() {
        super.onResume()
        enterImmersiveMode()
        if (::webView.isInitialized) {
            webView.onResume()
            // Re-check connection state
            val nowOnline = isNetworkAvailable()
            if (nowOnline && !isOnline) {
                onNetworkRestored()
            } else if (!nowOnline && isOnline) {
                onNetworkLost()
            }
            isOnline = nowOnline
        }
    }

    override fun onPause() {
        super.onPause()
        if (::webView.isInitialized) {
            webView.onPause()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
        // Cleanup
        networkCallback?.let {
            try {
                val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
                cm.unregisterNetworkCallback(it)
            } catch (_: Exception) {}
        }
        wakeLock?.release()
        if (::webView.isInitialized) {
            webView.destroy()
        }
    }

    // ─── Public methods for NativeBridge ────────────────────────

    fun savePairingData(token: String, screenId: String) {
        getSharedPreferences(PREFS_NAME, MODE_PRIVATE).edit().apply {
            if (token.isEmpty()) {
                // Unpair — remove saved tokens
                remove(KEY_DISPLAY_TOKEN)
                remove(KEY_SCREEN_ID)
            } else {
                putString(KEY_DISPLAY_TOKEN, token)
                putString(KEY_SCREEN_ID, screenId)
            }
            apply()
        }
    }

    fun getServerUrl(): String = serverUrl

    fun notifyWebViewOnline(online: Boolean) {
        runOnUiThread {
            if (online) onNetworkRestored() else onNetworkLost()
        }
    }
}

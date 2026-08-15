package com.signage.player.bridge

import android.content.Context
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import com.signage.player.MainActivity
import com.signage.player.NativePlayerActivity
import com.signage.player.service.OfflineCacheService
import org.json.JSONObject
import java.io.File

/**
 * NativeBridge — JavaScript ↔ Native Communication
 *
 * Exposed as `window.SignageNative` in WebView.
 * Handles:
 * - Pairing data persistence (NFR-02: survive app restart)
 * - Offline media URL resolution (NFR-02: IndexedDB-like cache)
 * - Video lifecycle management (NFR-03: memory management)
 * - A/B buffer coordination (Architecture 10.2)
 * - Heartbeat reporting
 */
class NativeBridge(
    private val activity: MainActivity,
    private val webView: WebView
) {
    companion object {
        private const val TAG = "NativeBridge"
    }

    // ─── Pairing Persistence ────────────────────────────────────

    /**
     * Called by web app after successful pairing
     * Saves display token and screen ID to SharedPreferences
     * so the app can auto-reconnect on restart (NFR-02)
     */
    @JavascriptInterface
    fun onPaired(token: String, screenId: String) {
        Log.i(TAG, "Pairing saved: screenId=$screenId")
        activity.savePairingData(token, screenId)
        // Let WebView handle the display — it will redirect to /display/:id automatically
        // NativePlayerActivity is available as optional upgrade (launched on next app restart)
    }

    /**
     * Called by web app when unpaired (remote or local)
     * Clears native SharedPreferences so next restart shows pairing
     */
    @JavascriptInterface
    fun onUnpaired() {
        Log.i(TAG, "Unpaired — clearing native token")
        activity.savePairingData("", "")
    }

    /**
     * Get the configured server URL
     */
    @JavascriptInterface
    fun getServerUrl(): String {
        return activity.getServerUrl()
    }

    /**
     * Check if device is currently online
     */
    @JavascriptInterface
    fun isOnline(): Boolean {
        return try {
            val cm = activity.getSystemService(Context.CONNECTIVITY_SERVICE) as android.net.ConnectivityManager
            val network = cm.activeNetwork
            network != null
        } catch (e: Exception) {
            false
        }
    }

    // ─── Offline Media Cache (NFR-02) ───────────────────────────

    /**
     * Get local file path for a cached media item
     * Returns empty string if not cached
     *
     * Web app calls this to resolve offline URLs:
     *   const localUrl = SignageNative.getCachedMediaUrl(mediaId);
     *   if (localUrl) video.src = localUrl;
     */
    @JavascriptInterface
    fun getCachedMediaUrl(mediaId: String): String {
        val cacheDir = File(activity.filesDir, OfflineCacheService.CACHE_SUBDIR)
        val manifestFile = File(cacheDir, "manifest.json")

        return try {
            if (!manifestFile.exists()) return ""
            val manifest = JSONObject(manifestFile.readText())
            val entry = manifest.optJSONObject(mediaId) ?: return ""
            val path = entry.optString("localPath", "")
            if (File(path).exists()) {
                // Return file:// URL for WebView
                "file://$path"
            } else ""
        } catch (e: Exception) {
            Log.e(TAG, "getCachedMediaUrl error: ${e.message}")
            ""
        }
    }

    /**
     * Get the full offline manifest as JSON string
     * Web app uses this to know which media is available offline
     */
    @JavascriptInterface
    fun getOfflineManifest(): String {
        val cacheDir = File(activity.filesDir, OfflineCacheService.CACHE_SUBDIR)
        val manifestFile = File(cacheDir, "manifest.json")

        return try {
            if (manifestFile.exists()) manifestFile.readText() else "{}"
        } catch (e: Exception) {
            "{}"
        }
    }

    /**
     * Get cache storage usage in MB
     */
    @JavascriptInterface
    fun getCacheUsageMb(): Int {
        val cacheDir = File(activity.filesDir, OfflineCacheService.CACHE_SUBDIR)
        if (!cacheDir.exists()) return 0
        val totalBytes = cacheDir.walkTopDown().filter { it.isFile }.sumOf { it.length() }
        return (totalBytes / (1024 * 1024)).toInt()
    }

    // ─── Video Memory Management (NFR-03, Architecture 10.2-10.3) ─

    /**
     * Notify native that a video element is being destroyed
     * Ensures GPU buffer release on Android TV
     *
     * Web app calls before swapping video sources:
     *   SignageNative.onVideoDestroy('video-a');
     *   videoA.pause(); videoA.removeAttribute('src'); videoA.load();
     */
    @JavascriptInterface
    fun onVideoDestroy(elementId: String) {
        Log.d(TAG, "Video destroyed: $elementId — GPU buffer released")
        // On Android, WebView handles GPU release internally when src is cleared
        // This hook is for logging and potential future native video player integration
    }

    /**
     * Notify native of A/B buffer swap
     * Architecture 10.2: Double-Video A/B Buffering
     *
     * @param activeSlot "A" or "B" — which video element is now visible
     * @param preloadUrl URL being preloaded into the inactive slot
     */
    @JavascriptInterface
    fun onBufferSwap(activeSlot: String, preloadUrl: String) {
        Log.d(TAG, "Buffer swap: active=$activeSlot, preloading=$preloadUrl")
        // Could trigger pre-caching of the preload URL if not already cached
    }

    /**
     * Report current memory usage from web
     * Allows native to trigger garbage collection if needed
     */
    @JavascriptInterface
    fun reportMemoryUsage(usedHeapMb: Int, totalHeapMb: Int) {
        if (usedHeapMb > totalHeapMb * 0.85) {
            Log.w(TAG, "High memory usage: ${usedHeapMb}MB / ${totalHeapMb}MB — suggesting GC")
            // Inject GC suggestion into WebView
            activity.runOnUiThread {
                webView.evaluateJavascript(
                    "if(window.gc) window.gc(); console.log('[Native] Memory cleanup suggested');",
                    null
                )
            }
        }
    }

    // ─── Heartbeat & Telemetry ──────────────────────────────────

    /**
     * Called periodically from web app (every 30s)
     * Reports device status back to native for monitoring
     */
    @JavascriptInterface
    fun heartbeat(status: String, heapUsed: Long) {
        Log.d(TAG, "Heartbeat: status=$status, heapUsed=${heapUsed / 1024}KB")
    }

    /**
     * Log a telemetry event from the web app
     */
    @JavascriptInterface
    fun logEvent(eventType: String, message: String) {
        Log.i(TAG, "[$eventType] $message")
    }

    // ─── Device Info ────────────────────────────────────────────

    /**
     * Get device info for the web app
     * Used during pairing to report device capabilities
     */
    @JavascriptInterface
    fun getDeviceInfo(): String {
        return JSONObject().apply {
            put("platform", "android_tv")
            put("model", android.os.Build.MODEL)
            put("manufacturer", android.os.Build.MANUFACTURER)
            put("sdkVersion", android.os.Build.VERSION.SDK_INT)
            put("resolution", "${getScreenWidth()}x${getScreenHeight()}")
            put("playerVersion", "1.0.0")
            put("cacheUsageMb", getCacheUsageMb())
            // Network info จริง (REQ-001) — server เก็บไว้โชว์ใน Network Info
            put("ipAddress", getLocalIpAddress())
            put("macAddress", getMacAddress())
        }.toString()
    }

    /**
     * หา IPv4 จริงของเครื่อง (ไม่ใช่ loopback)
     * หมายเหตุ: Android 10+ ค่า IP นี้คือ IP ของ interface ที่ต่อ network จริง
     */
    private fun getLocalIpAddress(): String {
        return try {
            val interfaces = java.net.NetworkInterface.getNetworkInterfaces() ?: return ""
            for (nif in interfaces) {
                if (!nif.isUp || nif.isLoopback) continue
                for (addr in nif.inetAddresses) {
                    val a = addr as? java.net.Inet4Address ?: continue
                    if (a.isLoopbackAddress) continue
                    return a.hostAddress ?: ""
                }
            }
            ""
        } catch (e: Exception) {
            ""
        }
    }

    /**
     * หา MAC address ของ interface ที่ใช้งาน (best-effort)
     * หมายเหตุ: Android 10+ มักได้ค่า MAC แบบ randomized ต่อ network (MAC randomize)
     * — ยังเป็นค่าจริงของ device ที่รายงาน แต่ต่างจาก MAC ฮาร์ดแวร์ที่ router เห็น
     */
    private fun getMacAddress(): String {
        return try {
            val interfaces = java.net.NetworkInterface.getNetworkInterfaces() ?: return ""
            for (nif in interfaces) {
                if (!nif.isUp || nif.isLoopback) continue
                val mac = nif.hardwareAddress ?: continue
                if (mac.isEmpty()) continue
                return mac.joinToString(":") { String.format("%02X", it) }
            }
            ""
        } catch (e: Exception) {
            ""
        }
    }

    private fun getScreenWidth(): Int {
        val display = activity.windowManager.defaultDisplay
        val size = android.graphics.Point()
        display.getRealSize(size)
        return size.x
    }

    private fun getScreenHeight(): Int {
        val display = activity.windowManager.defaultDisplay
        val size = android.graphics.Point()
        display.getRealSize(size)
        return size.y
    }

    // ─── Navigation Control ─────────────────────────────────────

    /**
     * Request to open settings (escape kiosk temporarily)
     * Only works if user knows the secret pattern
     */
    @JavascriptInterface
    fun requestSettings() {
        // Only honored from web if debug mode
        Log.i(TAG, "Settings requested from web")
    }

    /**
     * Request app restart (e.g., after pairing or error recovery)
     */
    @JavascriptInterface
    fun requestRestart() {
        activity.runOnUiThread {
            val intent = activity.packageManager.getLaunchIntentForPackage(activity.packageName)
            intent?.addFlags(android.content.Intent.FLAG_ACTIVITY_CLEAR_TASK or android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
            activity.startActivity(intent)
            Runtime.getRuntime().exit(0)
        }
    }
}

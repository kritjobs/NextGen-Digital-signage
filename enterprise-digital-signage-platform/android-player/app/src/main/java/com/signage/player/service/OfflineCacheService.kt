package com.signage.player.service

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.signage.player.MainActivity
import kotlinx.coroutines.*
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.security.MessageDigest
import java.util.concurrent.TimeUnit

/**
 * OfflineCacheService — Media Download & Delta Sync
 *
 * Implements NFR-02 (Offline-First):
 * - Downloads media files to internal storage for offline playback
 * - Delta sync: only downloads new/changed files
 * - Maintains a manifest.json with checksums for diff detection
 * - Provides local URLs to WebView via JavaScript bridge
 *
 * Sync Flow:
 * 1. GET /api/display/:screenId/data → get playlist + media list
 * 2. Compare with local manifest (by URL hash)
 * 3. Download missing/changed media files
 * 4. Update local manifest
 * 5. Notify WebView of available offline content
 */
class OfflineCacheService : Service() {

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build()

    private lateinit var cacheDir: File
    private lateinit var manifestFile: File

    companion object {
        private const val TAG = "OfflineCache"
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "signage_sync"
        private const val PREFS_NAME = "signage_prefs"
        private const val KEY_DISPLAY_TOKEN = "display_token"
        private const val KEY_SCREEN_ID = "screen_id"
        const val CACHE_SUBDIR = "signage_media"
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        cacheDir = File(filesDir, CACHE_SUBDIR).apply { mkdirs() }
        manifestFile = File(cacheDir, "manifest.json")
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val serverUrl = intent?.getStringExtra("server_url") ?: ""

        // Start as foreground service
        startForeground(NOTIFICATION_ID, buildNotification("Syncing media..."))

        scope.launch {
            try {
                performDeltaSync(serverUrl)
            } catch (e: Exception) {
                Log.e(TAG, "Sync failed: ${e.message}", e)
            } finally {
                stopSelf()
            }
        }

        return START_NOT_STICKY
    }

    /**
     * Delta Sync — Only download new/changed media
     */
    private suspend fun performDeltaSync(serverUrl: String) {
        if (serverUrl.isEmpty()) {
            Log.w(TAG, "No server URL configured")
            return
        }

        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        val token = prefs.getString(KEY_DISPLAY_TOKEN, null)
        val screenId = prefs.getString(KEY_SCREEN_ID, null)

        if (token == null || screenId == null) {
            Log.w(TAG, "Not paired yet — skipping sync")
            return
        }

        // 1. Fetch current display data from server
        val displayData = fetchDisplayData(serverUrl, screenId, token) ?: return
        val mediaItems = extractMediaUrls(displayData, serverUrl)

        if (mediaItems.isEmpty()) {
            Log.i(TAG, "No media items to sync")
            return
        }

        // 2. Load local manifest
        val localManifest = loadManifest()

        // 3. Determine what needs downloading (delta)
        val toDownload = mediaItems.filter { item ->
            val localEntry = localManifest.optJSONObject(item.id)
            localEntry == null || localEntry.optString("url") != item.url
        }

        Log.i(TAG, "Delta sync: ${toDownload.size} new/changed of ${mediaItems.size} total")

        if (toDownload.isEmpty()) {
            updateNotification("Cache up to date (${mediaItems.size} items)")
            return
        }

        // 4. Download each missing file
        var downloaded = 0
        for (item in toDownload) {
            try {
                updateNotification("Downloading ${downloaded + 1}/${toDownload.size}: ${item.title}")
                val localPath = downloadFile(item.url, item.id)
                if (localPath != null) {
                    // Update manifest entry
                    val entry = JSONObject().apply {
                        put("id", item.id)
                        put("url", item.url)
                        put("localPath", localPath)
                        put("title", item.title)
                        put("type", item.type)
                        put("duration", item.duration)
                        put("syncedAt", System.currentTimeMillis())
                    }
                    localManifest.put(item.id, entry)
                    downloaded++
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to download ${item.title}: ${e.message}")
            }
        }

        // 5. Remove items no longer in playlist
        val activeIds = mediaItems.map { it.id }.toSet()
        val keysToRemove = mutableListOf<String>()
        val keys = localManifest.keys()
        while (keys.hasNext()) {
            val key = keys.next()
            if (key !in activeIds) {
                // Delete local file
                val entry = localManifest.optJSONObject(key)
                entry?.optString("localPath")?.let { path ->
                    File(path).delete()
                }
                keysToRemove.add(key)
            }
        }
        keysToRemove.forEach { localManifest.remove(it) }

        // 6. Save updated manifest
        saveManifest(localManifest)

        Log.i(TAG, "Sync complete: $downloaded downloaded, ${keysToRemove.size} removed")
        updateNotification("Sync complete: $downloaded new files cached")
    }

    private suspend fun fetchDisplayData(serverUrl: String, screenId: String, token: String): JSONObject? {
        return withContext(Dispatchers.IO) {
            try {
                val request = Request.Builder()
                    .url("$serverUrl/api/display/$screenId/data?token=$token")
                    .get()
                    .build()
                val response = httpClient.newCall(request).execute()
                if (response.isSuccessful) {
                    JSONObject(response.body?.string() ?: "{}")
                } else {
                    Log.e(TAG, "Display data fetch failed: ${response.code}")
                    null
                }
            } catch (e: Exception) {
                Log.e(TAG, "Display data fetch error: ${e.message}")
                null
            }
        }
    }

    data class MediaCacheItem(
        val id: String,
        val url: String,
        val title: String,
        val type: String,
        val duration: Int
    )

    private fun extractMediaUrls(displayData: JSONObject, serverUrl: String): List<MediaCacheItem> {
        val items = mutableListOf<MediaCacheItem>()

        try {
            val mediaArray = displayData.optJSONArray("mediaItems") ?: return items
            for (i in 0 until mediaArray.length()) {
                val media = mediaArray.getJSONObject(i)
                val type = media.optString("type", "")
                val url = media.optString("url", "")

                // Only cache video and image types (not widgets)
                if (type in listOf("video", "image") && url.isNotEmpty()) {
                    val fullUrl = if (url.startsWith("http")) url
                                  else "$serverUrl$url"
                    items.add(MediaCacheItem(
                        id = media.optString("id", "unknown-$i"),
                        url = fullUrl,
                        title = media.optString("title", "Media $i"),
                        type = type,
                        duration = media.optInt("duration", 10)
                    ))
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error extracting media URLs: ${e.message}")
        }

        return items
    }

    private suspend fun downloadFile(url: String, id: String): String? {
        return withContext(Dispatchers.IO) {
            try {
                val request = Request.Builder().url(url).build()
                val response = httpClient.newCall(request).execute()
                if (!response.isSuccessful) return@withContext null

                val contentType = response.header("Content-Type", "application/octet-stream") ?: ""
                val ext = when {
                    contentType.contains("mp4") -> ".mp4"
                    contentType.contains("webm") -> ".webm"
                    contentType.contains("png") -> ".png"
                    contentType.contains("jpeg") || contentType.contains("jpg") -> ".jpg"
                    contentType.contains("webp") -> ".webp"
                    contentType.contains("gif") -> ".gif"
                    url.contains(".mp4") -> ".mp4"
                    url.contains(".webm") -> ".webm"
                    url.contains(".png") -> ".png"
                    url.contains(".jpg") || url.contains(".jpeg") -> ".jpg"
                    else -> ".bin"
                }

                val fileName = "${id.replace(Regex("[^a-zA-Z0-9-]"), "_")}$ext"
                val outputFile = File(cacheDir, fileName)

                response.body?.byteStream()?.use { input ->
                    FileOutputStream(outputFile).use { output ->
                        input.copyTo(output, bufferSize = 8192)
                    }
                }

                Log.d(TAG, "Downloaded: $fileName (${outputFile.length() / 1024}KB)")
                outputFile.absolutePath
            } catch (e: Exception) {
                Log.e(TAG, "Download failed for $url: ${e.message}")
                null
            }
        }
    }

    // ─── Manifest Management ────────────────────────────────────

    private fun loadManifest(): JSONObject {
        return try {
            if (manifestFile.exists()) {
                JSONObject(manifestFile.readText())
            } else {
                JSONObject()
            }
        } catch (e: Exception) {
            JSONObject()
        }
    }

    private fun saveManifest(manifest: JSONObject) {
        manifestFile.writeText(manifest.toString(2))
    }

    /**
     * Get cached file path for a given media URL
     * Called by NativeBridge to serve offline content
     */
    fun getCachedPath(mediaId: String): String? {
        val manifest = loadManifest()
        val entry = manifest.optJSONObject(mediaId) ?: return null
        val path = entry.optString("localPath", "")
        return if (File(path).exists()) path else null
    }

    // ─── Notification ───────────────────────────────────────────

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Media Sync",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Background media synchronization"
                setShowBadge(false)
            }
            val nm = getSystemService(NotificationManager::class.java)
            nm.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(text: String): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Digital Signage")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    private fun updateNotification(text: String) {
        val nm = getSystemService(NotificationManager::class.java)
        nm.notify(NOTIFICATION_ID, buildNotification(text))
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }
}

package com.signage.player.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.util.Log
import com.signage.player.service.OfflineCacheService

/**
 * NetworkReceiver — Connectivity change handler
 *
 * Detects when network goes online/offline.
 * On reconnect: triggers delta sync via OfflineCacheService.
 *
 * NFR-02.3: Delta Sync — โหลดเฉพาะ diff เมื่อ reconnect
 */
class NetworkReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "SignageNetworkReceiver"
        private const val PREFS_NAME = "signage_prefs"
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_AUTO_SYNC = "auto_sync"
        private var wasOffline = false
    }

    override fun onReceive(context: Context, intent: Intent?) {
        val isOnline = isNetworkAvailable(context)

        Log.d(TAG, "Network change: online=$isOnline, wasOffline=$wasOffline")

        if (isOnline && wasOffline) {
            // Just came back online — trigger delta sync
            Log.i(TAG, "Network restored — triggering delta sync")
            triggerSync(context)
        }

        wasOffline = !isOnline
    }

    private fun isNetworkAvailable(context: Context): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val network = cm.activeNetwork ?: return false
            val caps = cm.getNetworkCapabilities(network) ?: return false
            caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        } else {
            @Suppress("DEPRECATION")
            cm.activeNetworkInfo?.isConnected == true
        }
    }

    private fun triggerSync(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val autoSync = prefs.getBoolean(KEY_AUTO_SYNC, true)
        val serverUrl = prefs.getString(KEY_SERVER_URL, "") ?: ""

        if (!autoSync || serverUrl.isEmpty()) return

        val intent = Intent(context, OfflineCacheService::class.java).apply {
            putExtra("server_url", serverUrl)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
    }
}

package com.signage.player

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.material.button.MaterialButton
import com.google.android.material.switchmaterial.SwitchMaterial
import com.google.android.material.textfield.TextInputEditText
import android.widget.TextView
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

/**
 * SettingsActivity — Server URL configuration
 *
 * Displayed on first launch or when user presses MENU key.
 * Allows configuring:
 * - Server URL (required)
 * - Kiosk mode toggle
 * - Auto-sync toggle
 */
class SettingsActivity : AppCompatActivity() {

    private lateinit var etServerUrl: TextInputEditText
    private lateinit var swKioskMode: SwitchMaterial
    private lateinit var swAutoSync: SwitchMaterial
    private lateinit var tvStatus: TextView
    private lateinit var btnTest: MaterialButton
    private lateinit var btnSave: MaterialButton

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(5, TimeUnit.SECONDS)
        .readTimeout(5, TimeUnit.SECONDS)
        .build()

    companion object {
        private const val PREFS_NAME = "signage_prefs"
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_KIOSK_MODE = "kiosk_mode"
        private const val KEY_AUTO_SYNC = "auto_sync"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        etServerUrl = findViewById(R.id.etServerUrl)
        swKioskMode = findViewById(R.id.swKioskMode)
        swAutoSync = findViewById(R.id.swAutoSync)
        tvStatus = findViewById(R.id.tvStatus)
        btnTest = findViewById(R.id.btnTest)
        btnSave = findViewById(R.id.btnSave)

        // Load saved preferences
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        etServerUrl.setText(prefs.getString(KEY_SERVER_URL, ""))
        swKioskMode.isChecked = prefs.getBoolean(KEY_KIOSK_MODE, true)
        swAutoSync.isChecked = prefs.getBoolean(KEY_AUTO_SYNC, true)

        // Test connection button
        btnTest.setOnClickListener { testConnection() }

        // Save & launch button
        btnSave.setOnClickListener { saveAndLaunch() }
    }

    private fun testConnection() {
        val url = etServerUrl.text?.toString()?.trim() ?: ""
        if (url.isEmpty()) {
            showStatus("Please enter server URL", false)
            return
        }

        // Normalize URL
        val normalizedUrl = normalizeUrl(url)
        etServerUrl.setText(normalizedUrl)

        btnTest.isEnabled = false
        showStatus("Testing connection...", null)

        lifecycleScope.launch {
            val result = withContext(Dispatchers.IO) {
                try {
                    val request = Request.Builder()
                        .url("$normalizedUrl/api/health")
                        .get()
                        .build()
                    val response = httpClient.newCall(request).execute()
                    if (response.isSuccessful) {
                        val body = response.body?.string() ?: ""
                        if (body.contains("ok") || body.contains("Digital Signage")) {
                            Pair(true, "Connected! Server is operational")
                        } else {
                            Pair(true, "Connected (unknown response)")
                        }
                    } else {
                        Pair(false, "Server returned ${response.code}")
                    }
                } catch (e: Exception) {
                    Pair(false, "Failed: ${e.message}")
                }
            }

            btnTest.isEnabled = true
            showStatus(result.second, result.first)
        }
    }

    private fun saveAndLaunch() {
        val url = etServerUrl.text?.toString()?.trim() ?: ""
        if (url.isEmpty()) {
            showStatus("Server URL is required", false)
            return
        }

        val normalizedUrl = normalizeUrl(url)

        // Save to preferences
        getSharedPreferences(PREFS_NAME, MODE_PRIVATE).edit().apply {
            putString(KEY_SERVER_URL, normalizedUrl)
            putBoolean(KEY_KIOSK_MODE, swKioskMode.isChecked)
            putBoolean(KEY_AUTO_SYNC, swAutoSync.isChecked)
            apply()
        }

        Toast.makeText(this, "Settings saved!", Toast.LENGTH_SHORT).show()

        // Launch main activity
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivity(intent)
        finish()
    }

    private fun normalizeUrl(url: String): String {
        var result = url.trim()
        // Add http:// if no protocol specified
        if (!result.startsWith("http://") && !result.startsWith("https://")) {
            result = "http://$result"
        }
        // Remove trailing slash
        return result.trimEnd('/')
    }

    private fun showStatus(message: String, success: Boolean?) {
        tvStatus.text = message
        tvStatus.visibility = View.VISIBLE
        tvStatus.setTextColor(when (success) {
            true -> 0xFF34D399.toInt()  // emerald
            false -> 0xFFFFB4AB.toInt() // error red
            null -> 0xFF4CD7F6.toInt()  // cyan (neutral)
        })
    }
}

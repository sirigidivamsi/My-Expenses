package com.vamsivibecoding.myexpenses.notificationlistener

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.content.Context
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class NotificationListener : NotificationListenerService() {
  private val TAG = "NotificationListener"

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    val packageName = sbn.packageName
    val extras = sbn.notification.extras
    val title = extras.getString("android.title", "")
    val text = extras.getCharSequence("android.text", "").toString()
    val timestamp = sbn.postTime

    val sharedPrefs = getSharedPreferences("notification_listener_prefs", Context.MODE_PRIVATE)
    
    // Check if app is enabled
    val supportedAppsJson = sharedPrefs.getString("supported_apps", "[]") ?: "[]"
    val supportedApps = try {
      val array = JSONArray(supportedAppsJson)
      val list = mutableListOf<String>()
      for (i in 0 until array.length()) {
        list.add(array.getString(i))
      }
      list
    } catch (e: Exception) {
      emptyList<String>()
    }

    // Default package list in case supportedApps is empty
    val defaultApps = listOf(
      "com.google.android.apps.nbu.paisa.user", // Google Pay
      "com.phonepe.app",                       // PhonePe
      "net.one97.paytm",                       // Paytm
      "com.amazon.mShop.android.shopping",     // Amazon Pay
      "com.snapwork.hdfc",                     // HDFC
      "com.csg.imobile",                       // ICICI
      "com.sbi.anywhere",                      // SBI
      "com.axis.mobile",                       // Axis
      "com.msf.kbank.mobile",                  // Kotak
      "com.indusind.mobile"                    // IndusInd
    )

    val appsToListen = if (supportedApps.isNotEmpty()) supportedApps else defaultApps

    if (!appsToListen.contains(packageName)) {
      return
    }

    // Security check: Ignore OTPs, personal messages, verification codes, account credentials
    val bodyLower = text.lowercase(Locale.ROOT)
    val isOtp = bodyLower.contains("otp") || 
                bodyLower.contains("one time password") || 
                bodyLower.contains("verification code") || 
                bodyLower.contains("secure code") || 
                bodyLower.contains("password") || 
                bodyLower.contains("pin")
    if (isOtp) {
      Log.d(TAG, "Security filter triggered: Ignored potential OTP notification")
      return
    }

    // Check for financial terms
    val isTransaction = bodyLower.contains("paid") || 
                         bodyLower.contains("debited") || 
                         bodyLower.contains("spent") ||
                         bodyLower.contains("sent") || 
                         bodyLower.contains("purchase") || 
                         bodyLower.contains("received") ||
                         bodyLower.contains("credited") || 
                         bodyLower.contains("refund") || 
                         bodyLower.contains("cashback") ||
                         bodyLower.contains("rs") || 
                         bodyLower.contains("inr") || 
                         bodyLower.contains("₹")

    if (!isTransaction) {
      return
    }

    // Add to pending notifications cache
    val pendingJson = sharedPrefs.getString("pending_notifications", "[]") ?: "[]"
    try {
      val array = JSONArray(pendingJson)
      
      val item = JSONObject().apply {
        put("notification_id", sbn.id.toString() + "_" + timestamp)
        put("app_name", getAppNameFromPackage(packageName))
        put("package_name", packageName)
        put("title", title)
        put("body", text)
        put("timestamp", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date(timestamp)))
      }
      
      array.put(item)
      sharedPrefs.edit().putString("pending_notifications", array.toString()).apply()
      Log.d(TAG, "Stored transaction notification from $packageName")
    } catch (e: Exception) {
      Log.e(TAG, "Error saving notification to shared preferences", e)
    }
  }

  private fun getAppNameFromPackage(packageName: String): String {
    return when (packageName) {
      "com.google.android.apps.nbu.paisa.user" -> "Google Pay"
      "com.phonepe.app" -> "PhonePe"
      "net.one97.paytm" -> "Paytm"
      "com.amazon.mShop.android.shopping" -> "Amazon Pay"
      "com.snapwork.hdfc" -> "HDFC Bank"
      "com.csg.imobile" -> "ICICI Bank"
      "com.sbi.anywhere" -> "SBI"
      "com.axis.mobile" -> "Axis Bank"
      "com.msf.kbank.mobile" -> "Kotak Bank"
      "com.indusind.mobile" -> "IndusInd Bank"
      else -> packageName
    }
  }
}

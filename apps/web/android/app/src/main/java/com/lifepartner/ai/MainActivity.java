package com.lifepartner.ai;

import android.Manifest;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends BridgeActivity {

    private static final int NOTIF_PERMISSION_CODE = 101;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Request notification permission on Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this,
                        new String[]{Manifest.permission.POST_NOTIFICATIONS},
                        NOTIF_PERMISSION_CODE);
            }
        }

        // Inject a JavaScript interface so the web app can read/write the auth token natively
        WebView webView = getBridge().getWebView();
        webView.addJavascriptInterface(new NativeBridge(), "AndroidBridge");

        // Fetch and register FCM token
        fetchAndRegisterToken();
    }

    private void fetchAndRegisterToken() {
        SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", MODE_PRIVATE);
        boolean isPushDisabled = prefs.getBoolean("push_disabled", false);
        if (isPushDisabled) {
            return; // Abort registration because the user explicitly toggled notifications Off
        }

        FirebaseMessaging.getInstance().getToken().addOnSuccessListener(token -> {
            if (token != null) {
                prefs.edit().putString("fcm_token", token).apply();

                String authToken = prefs.getString("auth_token", null);
                if (authToken != null) {
                    MyFirebaseMessagingService.registerTokenWithBackend(this, authToken);
                }
            }
        });
    }

    /**
     * JavaScript interface so the web page can pass the auth token to native code.
     * The web app calls: window.AndroidBridge.setAuthToken("jwt_token_here")
     */
    class NativeBridge {
        @JavascriptInterface
        public void setAuthToken(String authToken) {
            SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", MODE_PRIVATE);
            prefs.edit().putString("auth_token", authToken).apply();
            // Now register the FCM token with backend using this auth token
            MyFirebaseMessagingService.registerTokenWithBackend(MainActivity.this, authToken);
        }

        @JavascriptInterface
        public String getFcmToken() {
            SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", MODE_PRIVATE);
            return prefs.getString("fcm_token", "");
        }

        @JavascriptInterface
        public void disablePush() {
            SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", MODE_PRIVATE);
            prefs.edit().putBoolean("push_disabled", true).apply();
            // Optional: You could proactively call FirebaseMessaging.getInstance().deleteToken() here natively.
        }

        @JavascriptInterface
        public void enablePush() {
            SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", MODE_PRIVATE);
            prefs.edit().putBoolean("push_disabled", false).apply();
            fetchAndRegisterToken();
        }
    }
}

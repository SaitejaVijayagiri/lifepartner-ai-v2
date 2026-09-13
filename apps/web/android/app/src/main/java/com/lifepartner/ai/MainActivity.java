package com.lifepartner.ai;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.google.firebase.messaging.FirebaseMessaging;
import com.onesignal.OneSignal;

import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "MainActivity";
    private static final int PERMISSION_REQUEST_CODE = 200;

    public static volatile String activeChatPartnerId = null;
    public static volatile boolean isAppInForeground = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        isAppInForeground = true;

        // 0. Ensure Android Notification Channels exist on OS before any push notification arrives
        createNotificationChannels();

        // 1. Initialize OneSignal if configured
        initOneSignal();

        // 2. Single-batch runtime permission handling to prevent permission dialog collision & crashes
        requestAppPermissions();

        // 3. Safely inject JavaScript interface with null check
        setupNativeBridge();

        // 4. Setup WebChromeClient to grant WebRTC Camera/Mic permissions to WebView
        setupWebChromeClient();

        // 5. Fetch & register FCM token safely (legacy fallback)
        fetchAndRegisterToken();

        // 6. Monitor network state to flush offline queued replies and actions when reconnected
        registerNetworkMonitoring();

        // 7. Handle deep link from notification clicks
        handleNotificationDeepLink(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleNotificationDeepLink(intent);
    }

    private void handleNotificationDeepLink(Intent intent) {
        if (intent == null) return;
        android.net.Uri data = intent.getData();
        if (data != null) {
            String url = data.toString();
            Log.d(TAG, "Notification deep link received: " + url);
            String path = data.getPath();
            String query = data.getQuery();
            String targetPath = (path != null ? path : "/dashboard") + (query != null ? "?" + query : "");

            runOnUiThread(() -> {
                try {
                    if (getBridge() != null && getBridge().getWebView() != null) {
                        WebView webView = getBridge().getWebView();
                        String script = "if (typeof window !== 'undefined') { " +
                                "  if (window.location.pathname + window.location.search !== '" + targetPath + "') { " +
                                "    window.location.href = '" + targetPath + "'; " +
                                "  } else if (window.dispatchEvent) { " +
                                "    window.dispatchEvent(new CustomEvent('changeTab', { detail: { tab: 'requests' } })); " +
                                "  } " +
                                "}";
                        webView.postDelayed(() -> {
                            try {
                                webView.evaluateJavascript(script, null);
                            } catch (Exception ignored) {}
                        }, 1000);
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error handling deep link navigation: ", e);
                }
            });
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        isAppInForeground = true;
        try {
            SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", MODE_PRIVATE);
            prefs.edit().putBoolean("is_foreground", true).apply();
        } catch (Exception e) {}
        OfflineSyncManager.flushPendingActions(this);
    }

    @Override
    public void onPause() {
        super.onPause();
        isAppInForeground = false;
        try {
            SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", MODE_PRIVATE);
            prefs.edit().putBoolean("is_foreground", false).apply();
        } catch (Exception e) {}
    }

    private void registerNetworkMonitoring() {
        try {
            android.net.ConnectivityManager cm = (android.net.ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                cm.registerDefaultNetworkCallback(new android.net.ConnectivityManager.NetworkCallback() {
                    @Override
                    public void onAvailable(android.net.Network network) {
                        super.onAvailable(network);
                        Log.i(TAG, "Network became available! Draining offline queued actions...");
                        OfflineSyncManager.flushPendingActions(MainActivity.this);
                    }
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to register network monitoring: ", e);
        }
    }

    private static final String ONESIGNAL_APP_ID = "2f12f11f-1a09-408d-b609-4708a90b5609";

    private void initOneSignal() {
        try {
            OneSignal.initWithContext(this, ONESIGNAL_APP_ID);
            Log.d(TAG, "OneSignal initialized natively with App ID: " + ONESIGNAL_APP_ID);

            // Explicitly opt-in device to push notifications
            OneSignal.getUser().getPushSubscription().optIn();

            // Request Android 13+ Notification permission through OneSignal
            OneSignal.getNotifications().requestPermission(true, com.onesignal.Continue.with(r -> {
                Log.d(TAG, "OneSignal native permission result: " + r.getData());
                OneSignal.getUser().getPushSubscription().optIn();
            }));

            // Handle interactive button clicks (e.g. Accept / Decline) from OneSignal notifications
            OneSignal.getNotifications().addClickListener(event -> {
                try {
                    String actionId = event.getResult().getActionId();
                    Log.d(TAG, "OneSignal notification action clicked: " + actionId);
                    org.json.JSONObject additionalData = event.getNotification().getAdditionalData();
                    if (additionalData != null && actionId != null) {
                        String interactionId = additionalData.optString("interactionId", null);
                        if (interactionId == null) interactionId = additionalData.optString("id", null);

                        if (interactionId != null && ("accept".equals(actionId) || "decline".equals(actionId))) {
                            Intent reqIntent = new Intent(MainActivity.this, NotificationRequestReceiver.class);
                            reqIntent.setAction("accept".equals(actionId)
                                    ? "com.lifepartner.ai.ACTION_ACCEPT_REQUEST"
                                    : "com.lifepartner.ai.ACTION_DECLINE_REQUEST");
                            reqIntent.putExtra("interactionId", interactionId);
                            reqIntent.putExtra("action", actionId);
                            reqIntent.putExtra("notificationId", interactionId.hashCode());
                            sendBroadcast(reqIntent);
                        }
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error handling OneSignal click action: ", e);
                }
            });

            // Suppress foreground notifications if user is currently active in chat with the sender
            OneSignal.getNotifications().addForegroundLifecycleListener(event -> {
                try {
                    org.json.JSONObject additionalData = event.getNotification().getAdditionalData();
                    if (additionalData != null) {
                        String senderId = additionalData.optString("senderId", null);
                        if (senderId == null) senderId = additionalData.optString("connId", null);
                        if (senderId == null) senderId = additionalData.optString("from", null);

                        if (senderId != null && activeChatPartnerId != null && senderId.equals(activeChatPartnerId)) {
                            Log.i(TAG, "OneSignal: Suppressing notification because user is active in chat with: " + senderId);
                            event.preventDefault();
                        }
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error in OneSignal foreground listener: ", e);
                }
            });

            // Restore logged in user if available so notifications reach this device even after restart
            SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", MODE_PRIVATE);
            String savedUserId = prefs.getString("user_id", null);
            if (savedUserId != null && !savedUserId.trim().isEmpty()) {
                OneSignal.login(savedUserId);
                Log.d(TAG, "OneSignal restored login for user: " + savedUserId);
            }

            // Observe push subscription changes (ID & token) and register with backend
            OneSignal.getUser().getPushSubscription().addObserver(state -> {
                try {
                    String subId = state.getCurrent().getId();
                    String token = state.getCurrent().getToken();
                    Log.d(TAG, "OneSignal Subscription update: subId=" + subId + " token=" + token);
                    if (subId != null && !subId.isEmpty()) {
                        String authToken = prefs.getString("auth_token", null);
                        if (authToken != null && !authToken.trim().isEmpty()) {
                            sendOneSignalSubscriptionToBackend(subId, authToken);
                        }
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error in push subscription observer: ", e);
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Error initializing OneSignal: ", e);
        }
    }

    private void sendOneSignalSubscriptionToBackend(final String subId, final String authToken) {
        new Thread(() -> {
            try {
                String cleanBase = BuildConfig.API_BASE_URL.endsWith("/") 
                    ? BuildConfig.API_BASE_URL.substring(0, BuildConfig.API_BASE_URL.length() - 1) 
                    : BuildConfig.API_BASE_URL;
                URL url = new URI(cleanBase + "/notifications/register").toURL();
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                String authHeader = authToken.startsWith("Bearer ") ? authToken : "Bearer " + authToken;
                conn.setRequestProperty("Authorization", authHeader);
                conn.setDoOutput(true);
                conn.setConnectTimeout(10000);

                org.json.JSONObject payloadObj = new org.json.JSONObject();
                payloadObj.put("token", subId);
                payloadObj.put("platform", "onesignal");
                byte[] input = payloadObj.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
                try (java.io.OutputStream os = conn.getOutputStream()) {
                    os.write(input, 0, input.length);
                }
                int code = conn.getResponseCode();
                Log.d(TAG, "OneSignal subscription registered with backend response: " + code);
                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "Failed to send OneSignal subscription to backend: ", e);
            }
        }).start();
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                android.app.NotificationManager manager = getSystemService(android.app.NotificationManager.class);
                if (manager != null) {
                    android.media.AudioAttributes audioAttributes = new android.media.AudioAttributes.Builder()
                            .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                            .build();

                    android.app.NotificationChannel chatChannel = new android.app.NotificationChannel(
                            "lifepartner_chat",
                            "Chat Messages",
                            android.app.NotificationManager.IMPORTANCE_HIGH
                    );
                    chatChannel.setDescription("Direct messages and match alerts");
                    chatChannel.enableVibration(true);
                    chatChannel.setVibrationPattern(new long[]{100, 200, 300, 400, 500});
                    chatChannel.setLockscreenVisibility(androidx.core.app.NotificationCompat.VISIBILITY_PUBLIC);
                    chatChannel.setSound(android.provider.Settings.System.DEFAULT_NOTIFICATION_URI, audioAttributes);
                    manager.createNotificationChannel(chatChannel);

                    android.app.NotificationChannel notifChannel = new android.app.NotificationChannel(
                            "lifepartner_notifications",
                            "App Notifications",
                            android.app.NotificationManager.IMPORTANCE_HIGH
                    );
                    notifChannel.setDescription("General notifications and activity updates");
                    notifChannel.enableVibration(true);
                    notifChannel.setLockscreenVisibility(androidx.core.app.NotificationCompat.VISIBILITY_PUBLIC);
                    notifChannel.setSound(android.provider.Settings.System.DEFAULT_NOTIFICATION_URI, audioAttributes);
                    manager.createNotificationChannel(notifChannel);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error creating notification channels: ", e);
            }
        }
    }

    private void requestAppPermissions() {
        try {
            List<String> permissionsToRequest = new ArrayList<>();

            // Android 13+ Notification permission
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                        != PackageManager.PERMISSION_GRANTED) {
                    permissionsToRequest.add(Manifest.permission.POST_NOTIFICATIONS);
                }
            }

            // Camera permission for Video Calling
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                    != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.CAMERA);
            }

            // Microphone permission for Voice & Video Calling
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                    != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.RECORD_AUDIO);
            }

            if (!permissionsToRequest.isEmpty()) {
                ActivityCompat.requestPermissions(
                        this,
                        permissionsToRequest.toArray(new String[0]),
                        PERMISSION_REQUEST_CODE
                );
            }
        } catch (Exception e) {
            Log.e(TAG, "Error requesting permissions: ", e);
        }
    }

    private void setupNativeBridge() {
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                webView.addJavascriptInterface(new NativeBridge(), "AndroidBridge");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error injecting AndroidBridge: ", e);
        }
    }

    private void setupWebChromeClient() {
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                webView.setWebChromeClient(new WebChromeClient() {
                    @Override
                    public void onPermissionRequest(final PermissionRequest request) {
                        try {
                            runOnUiThread(() -> {
                                request.grant(request.getResources());
                            });
                        } catch (Exception e) {
                            Log.e(TAG, "Error granting web permission request: ", e);
                        }
                    }
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error setting WebChromeClient: ", e);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            Log.d(TAG, "Runtime permissions processed successfully.");
            // Re-verify bridge injection after permissions are resolved
            setupNativeBridge();
            setupWebChromeClient();
        }
    }

    private void fetchAndRegisterToken() {
        try {
            final SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", MODE_PRIVATE);
            boolean isPushDisabled = prefs.getBoolean("push_disabled", false);
            if (isPushDisabled) {
                return;
            }

            FirebaseMessaging.getInstance().getToken().addOnSuccessListener(token -> {
                if (token != null && !token.isEmpty()) {
                    prefs.edit().putString("fcm_token", token).apply();
                    String authToken = prefs.getString("auth_token", null);
                    if (authToken != null && !authToken.trim().isEmpty() && !authToken.equalsIgnoreCase("null")) {
                        MyFirebaseMessagingService.registerTokenWithBackend(MainActivity.this, authToken);
                    }
                }
            }).addOnFailureListener(e -> {
                Log.e(TAG, "Failed to get FCM token: ", e);
            });
        } catch (Exception e) {
            Log.e(TAG, "Error in fetchAndRegisterToken: ", e);
        }
    }

    /**
     * JavaScript interface so the web page can pass the auth token to native code.
     * The web app calls: window.AndroidBridge.setAuthToken("jwt_token_here")
     */
    class NativeBridge {
        @JavascriptInterface
        public void setAuthToken(String authToken) {
            try {
                if (authToken == null || authToken.trim().isEmpty() || authToken.equalsIgnoreCase("null")) {
                    Log.w(TAG, "NativeBridge.setAuthToken ignored invalid token.");
                    return;
                }
                SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", MODE_PRIVATE);
                prefs.edit().putString("auth_token", authToken).apply();
                MyFirebaseMessagingService.registerTokenWithBackend(MainActivity.this, authToken);

                String subId = OneSignal.getUser().getPushSubscription().getId();
                if (subId != null && !subId.isEmpty()) {
                    sendOneSignalSubscriptionToBackend(subId, authToken);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error in setAuthToken: ", e);
            }
        }

        @JavascriptInterface
        public String getFcmToken() {
            try {
                SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", MODE_PRIVATE);
                return prefs.getString("fcm_token", "");
            } catch (Exception e) {
                Log.e(TAG, "Error in getFcmToken: ", e);
                return "";
            }
        }

        @JavascriptInterface
        public void disablePush() {
            try {
                SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", MODE_PRIVATE);
                prefs.edit().putBoolean("push_disabled", true).apply();
                OneSignal.getUser().getPushSubscription().optOut();
                Log.d(TAG, "NativeBridge: Push notifications disabled and OneSignal opted out.");
            } catch (Exception e) {
                Log.e(TAG, "Error in disablePush: ", e);
            }
        }

        @JavascriptInterface
        public void setOneSignalAppId(String appId) {
            try {
                if (appId != null && !appId.trim().isEmpty()) {
                    SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", MODE_PRIVATE);
                    prefs.edit().putString("onesignal_app_id", appId).apply();
                    OneSignal.initWithContext(MainActivity.this, appId);
                    Log.d(TAG, "NativeBridge: OneSignal initialized with App ID: " + appId);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error setting OneSignal App ID via bridge: ", e);
            }
        }

        @JavascriptInterface
        public void loginUser(String userId) {
            try {
                if (userId != null && !userId.trim().isEmpty()) {
                    SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", MODE_PRIVATE);
                    prefs.edit().putString("user_id", userId).apply();
                    OneSignal.login(userId);
                    OneSignal.getUser().getPushSubscription().optIn();
                    Log.d(TAG, "NativeBridge: Logged in OneSignal user: " + userId);

                    String subId = OneSignal.getUser().getPushSubscription().getId();
                    String authToken = prefs.getString("auth_token", null);
                    if (authToken != null && !authToken.trim().isEmpty() && !authToken.equalsIgnoreCase("null")) {
                        MyFirebaseMessagingService.registerTokenWithBackend(MainActivity.this, authToken);
                        if (subId != null && !subId.isEmpty()) {
                            sendOneSignalSubscriptionToBackend(subId, authToken);
                        }
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Error logging in OneSignal user: ", e);
            }
        }

        @JavascriptInterface
        public void enablePush() {
            try {
                SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", MODE_PRIVATE);
                prefs.edit().putBoolean("push_disabled", false).apply();
                OneSignal.getUser().getPushSubscription().optIn();
                fetchAndRegisterToken();
            } catch (Exception e) {
                Log.e(TAG, "Error in enablePush: ", e);
            }
        }

        @JavascriptInterface
        public void setActiveChat(String partnerId) {
            MainActivity.activeChatPartnerId = (partnerId != null && !partnerId.trim().isEmpty() && !partnerId.equalsIgnoreCase("null")) ? partnerId.trim() : null;
            try {
                SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", MODE_PRIVATE);
                prefs.edit().putString("active_chat_id", MainActivity.activeChatPartnerId).apply();
                Log.d(TAG, "NativeBridge.setActiveChat: " + MainActivity.activeChatPartnerId);
            } catch (Exception e) {
                Log.e(TAG, "Error in setActiveChat: ", e);
            }
        }

        @JavascriptInterface
        public void setAppForeground(boolean isForeground) {
            MainActivity.isAppInForeground = isForeground;
            try {
                SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", MODE_PRIVATE);
                prefs.edit().putBoolean("is_foreground", isForeground).apply();
                Log.d(TAG, "NativeBridge.setAppForeground: " + isForeground);
            } catch (Exception e) {
                Log.e(TAG, "Error in setAppForeground: ", e);
            }
        }
    }
}

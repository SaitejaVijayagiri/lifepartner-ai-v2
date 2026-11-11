package com.lifepartner.ai;

import android.Manifest;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ActivityInfo;
import android.os.Build;
import android.content.ActivityNotFoundException;
import android.os.Bundle;
import android.net.Uri;
import android.provider.MediaStore;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.WindowManager;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.graphics.Color;

import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;
import com.getcapacitor.BridgeWebViewClient;
import com.google.firebase.messaging.FirebaseMessaging;
import com.onesignal.OneSignal;

import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;

import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "MainActivity";
    private static final int PERMISSION_REQUEST_CODE = 200;
    private static final int WEB_PERMISSION_REQUEST_CODE = 201;

    private PermissionRequest pendingWebPermissionRequest = null;
    private volatile String lastLoadedOrFailedUrl = "https://www.lifepartnerai.in?app=native";
    private boolean pushPermissionPromptedThisSession = false;

    public static volatile String activeChatPartnerId = null;
    public static volatile boolean isAppInForeground = false;
    public static volatile boolean isLandscapeActive = false;

    private RewardedAd rewardedAd;
    private boolean isAdLoading = false;

    private View mCustomView = null;
    private WebChromeClient.CustomViewCallback mCustomViewCallback = null;
    private FrameLayout mFullscreenContainer = null;
    private WebChromeClient mActiveChromeClient = null;

    public boolean hideCustomFullscreenView() {
        if (mCustomView != null) {
            onHideCustomViewInternal();
            return true;
        }
        return false;
    }

    private void onHideCustomViewInternal() {
        runOnUiThread(() -> {
            if (mCustomView == null) return;
            try {
                // Return to portrait orientation when exiting video fullscreen
                setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
            } catch (Exception ignored) {}

            ViewGroup decorView = (ViewGroup) getWindow().getDecorView();
            decorView.setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);

            if (mFullscreenContainer != null) {
                mFullscreenContainer.removeAllViews();
                mFullscreenContainer.setVisibility(View.GONE);
                if (mFullscreenContainer.getParent() != null) {
                    decorView.removeView(mFullscreenContainer);
                }
            }

            if (mCustomViewCallback != null) {
                try {
                    mCustomViewCallback.onCustomViewHidden();
                } catch (Exception ignored) {}
                mCustomViewCallback = null;
            }
            mCustomView = null;

            // Restore the main WebView visibility
            try {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    WebView webView = getBridge().getWebView();
                    webView.setVisibility(View.VISIBLE);
                    webView.requestFocus();
                }
            } catch (Exception ignored) {}
        });
    }

    public void showFullscreenVideoView(View view, WebChromeClient.CustomViewCallback callback) {
        if (mCustomView != null) {
            onHideCustomViewInternal();
            return;
        }

        mCustomView = view;
        mCustomViewCallback = callback;

        runOnUiThread(() -> {
            try {
                // 1. Hide the main WebView so it doesn't block the video
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().setVisibility(View.GONE);
                }

                // 2. Automatically switch to full landscape orientation
                setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);

                ViewGroup decorView = (ViewGroup) getWindow().getDecorView();
                if (mFullscreenContainer == null) {
                    mFullscreenContainer = new FrameLayout(MainActivity.this);
                    mFullscreenContainer.setBackgroundColor(Color.BLACK);
                }

                if (mFullscreenContainer.getParent() != null) {
                    ((ViewGroup) mFullscreenContainer.getParent()).removeView(mFullscreenContainer);
                }

                mFullscreenContainer.removeAllViews();
                mFullscreenContainer.addView(view, new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                ));

                decorView.addView(mFullscreenContainer, new ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                ));
                mFullscreenContainer.setVisibility(View.VISIBLE);
                mFullscreenContainer.bringToFront();

                // 3. Enter immersive sticky fullscreen for full video viewing
                decorView.setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                );
            } catch (Exception e) {
                Log.e(TAG, "Error showing custom fullscreen video view: ", e);
            }
        });
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        isAppInForeground = true;

        // Native App Theme: Match status bar and navigation bar with app slate palette
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            getWindow().clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            getWindow().setStatusBarColor(ContextCompat.getColor(this, R.color.colorPrimaryDark));
            getWindow().setNavigationBarColor(ContextCompat.getColor(this, R.color.colorPrimaryDark));
        }

        // Prevent content from overlapping camera punch-hole / notch (Samsung S24, Pixel, etc.)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            getWindow().getAttributes().layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_NEVER;
        }
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);

        // 0. Ensure Android Notification Channels exist on OS before any push notification arrives
        createNotificationChannels();

        // 1. Initialize OneSignal if configured
        initOneSignal();

        // 2. Camera, Microphone, and Notification permissions are requested just-in-time on demand (Play Policy compliance)

        // 3. Safely inject JavaScript interface with null check
        setupNativeBridge();

        // 4. Setup MNC-grade WebViewClient & WebChromeClient to intercept navigation & keep all pages inside app
        setupWebViewAndChromeClients();

        // 5. Fetch & register FCM token safely (legacy fallback)
        fetchAndRegisterToken();

        // 6. Monitor network state to flush offline queued replies and actions when reconnected
        registerNetworkMonitoring();

        // 7. Handle deep link from notification clicks
        handleNotificationDeepLink(getIntent());

        // 8. Initialize Google Mobile Ads (AdMob) for High-eCPM Rewarded Ads
        initAdMob();

        // 9. Register Back Pressed Dispatcher Callback for Android 10, 11, 12, 13, 14, 15+ (Gesture & Button)
        setupBackNavigationDispatcher();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleNotificationDeepLink(intent);
    }

    private void handleNotificationDeepLink(Intent intent) {
        if (intent == null) return;
        String targetPath = intent.getStringExtra("targetPath");
        if (targetPath == null || targetPath.isEmpty()) {
            android.net.Uri data = intent.getData();
            if (data != null) {
                String scheme = data.getScheme();
                if ("lifepartner".equalsIgnoreCase(scheme)) {
                    String host = data.getHost() != null ? data.getHost() : "";
                    if ("auth-callback".equalsIgnoreCase(host)) {
                        String token = data.getQueryParameter("token");
                        String userId = data.getQueryParameter("userId");
                        String next = data.getQueryParameter("next");
                        String userJson = data.getQueryParameter("user");
                        if (token != null && !token.trim().isEmpty()) {
                            SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", MODE_PRIVATE);
                            SharedPreferences.Editor editor = prefs.edit().putString("auth_token", token);
                            if (userId != null && !userId.trim().isEmpty()) {
                                editor.putString("user_id", userId);
                            }
                            editor.apply();
                            MyFirebaseMessagingService.registerTokenWithBackend(MainActivity.this, token);
                            if (userId != null && !userId.trim().isEmpty()) {
                                OneSignal.login(userId);
                            }
                            StringBuilder hash = new StringBuilder();
                            hash.append("native_token=").append(Uri.encode(token));
                            if (userId != null && !userId.isEmpty()) {
                                hash.append("&userId=").append(Uri.encode(userId));
                            }
                            if (next != null && !next.isEmpty()) {
                                hash.append("&next=").append(Uri.encode(next));
                            }
                            if (userJson != null && !userJson.isEmpty()) {
                                hash.append("&user=").append(Uri.encode(userJson));
                            }
                            final String authUrl = "https://www.lifepartnerai.in/auth/callback/google#" + hash.toString();
                            runOnUiThread(() -> {
                                try {
                                    if (getBridge() != null && getBridge().getWebView() != null) {
                                        getBridge().getWebView().loadUrl(authUrl);
                                    }
                                } catch (Exception e) {
                                    Log.e(TAG, "Failed to hand off OAuth session to WebView: ", e);
                                }
                            });
                            return;
                        }
                    }
                    String path = data.getPath() != null ? data.getPath() : "";
                    targetPath = "/" + host + path;
                    String query = data.getQuery();
                    if (query != null && !query.isEmpty()) {
                        targetPath += "?" + query;
                    }
                } else {
                    String path = data.getPath();
                    String query = data.getQuery();
                    targetPath = (path != null ? path : "/dashboard") + (query != null ? "?" + query : "");
                }
            }
        }
        if (targetPath != null && !targetPath.isEmpty()) {
            if (targetPath.startsWith("http://") || targetPath.startsWith("https://")) {
                try {
                    java.net.URI u = new java.net.URI(targetPath);
                    targetPath = u.getPath() + (u.getQuery() != null ? "?" + u.getQuery() : "");
                } catch (Exception ignored) {}
            }
            Log.d(TAG, "Notification deep link received: " + targetPath);
            navigateToPath(targetPath);
        }
    }

    private void initAdMob() {
        try {
            MobileAds.initialize(this, initializationStatus -> {
                Log.d(TAG, "Google Mobile Ads SDK Initialized.");
                loadRewardedAd();
            });
        } catch (Exception e) {
            Log.e(TAG, "Error initializing MobileAds: ", e);
        }
    }

    private void loadRewardedAd() {
        if (isAdLoading || rewardedAd != null) return;
        isAdLoading = true;
        AdRequest adRequest = new AdRequest.Builder().build();
        // Production Rewarded Video Ad Unit
        RewardedAd.load(this, "ca-app-pub-1408290775036355/7913400523", adRequest, new RewardedAdLoadCallback() {
            @Override
            public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                Log.w(TAG, "Rewarded ad failed to load: " + loadAdError.getMessage());
                rewardedAd = null;
                isAdLoading = false;
            }

            @Override
            public void onAdLoaded(@NonNull RewardedAd ad) {
                Log.d(TAG, "Rewarded ad loaded successfully.");
                rewardedAd = ad;
                isAdLoading = false;
            }
        });
    }

    public void showNativeRewardedAd() {
        runOnUiThread(() -> {
            if (rewardedAd != null) {
                rewardedAd.show(MainActivity.this, rewardItem -> {
                    Log.d(TAG, "User earned reward from rewarded video ad.");
                    if (getBridge() != null && getBridge().getWebView() != null) {
                        getBridge().getWebView().evaluateJavascript(
                            "if (window.onNativeAdRewardEarned) { window.onNativeAdRewardEarned(); }", 
                            null
                        );
                    }
                });
                rewardedAd = null;
                loadRewardedAd(); // Preload next ad
            } else {
                Log.w(TAG, "Rewarded ad not loaded yet, triggering web fallback.");
                loadRewardedAd();
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().evaluateJavascript(
                        "if (window.onNativeAdFallback) { window.onNativeAdFallback(); }", 
                        null
                    );
                }
            }
        });
    }

    private void navigateToPath(String targetPath) {
        if (targetPath == null || targetPath.trim().isEmpty()) return;
        String trimmed = targetPath.trim();
        if (trimmed.contains("://") || trimmed.startsWith("//") || trimmed.startsWith("javascript:") || trimmed.startsWith("data:")) return;
        final String cleanPath = trimmed.startsWith("/") ? trimmed : "/" + trimmed;
        if (cleanPath.startsWith("//")) return;
        runOnUiThread(() -> {
            try {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    WebView webView = getBridge().getWebView();
                    String quotedPath = org.json.JSONObject.quote(cleanPath);
                    String script = "if (typeof window !== 'undefined') { " +
                            "  if (window.location.pathname + window.location.search + window.location.hash !== " + quotedPath + ") { " +
                            "    window.location.href = " + quotedPath + "; " +
                            "  } else if (window.dispatchEvent) { " +
                            "    window.dispatchEvent(new CustomEvent('changeTab', { detail: { tab: 'requests' } })); " +
                            "  } " +
                            "}";
                    if (webView.getProgress() >= 90) {
                        webView.evaluateJavascript(script, null);
                    } else {
                        webView.postDelayed(() -> {
                            try {
                                webView.evaluateJavascript(script, null);
                            } catch (Exception ignored) {}
                        }, 200);
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Error handling deep link navigation: ", e);
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        isAppInForeground = true;
        try {
            SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", MODE_PRIVATE);
            prefs.edit().putBoolean("is_foreground", true).apply();
            String authToken = prefs.getString("auth_token", null);
            if (authToken != null && !authToken.trim().isEmpty() && !authToken.equalsIgnoreCase("null")) {
                MyFirebaseMessagingService.registerTokenWithBackend(this, authToken);
                String subId = OneSignal.getUser().getPushSubscription().getId();
                if (subId == null || subId.isEmpty()) {
                    subId = prefs.getString("onesignal_sub_id", null);
                }
                if (subId != null && !subId.isEmpty()) {
                    sendOneSignalSubscriptionToBackend(subId, authToken);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error refreshing tokens in onResume: ", e);
        }
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

            // Respect push preferences and defer OS notification permission prompt until user signs in or enables alerts
            SharedPreferences initPrefs = getSharedPreferences("LifePartnerPrefs", MODE_PRIVATE);
            if (!initPrefs.getBoolean("push_disabled", false)) {
                OneSignal.getUser().getPushSubscription().optIn();
            }

            // Handle interactive button clicks & notification clicks from OneSignal notifications
            OneSignal.getNotifications().addClickListener(event -> {
                try {
                    String actionId = event.getResult().getActionId();
                    Log.d(TAG, "OneSignal notification clicked, actionId=" + actionId);
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
                            return;
                        }

                        if ("like".equals(actionId)) {
                            String messageId = additionalData.optString("messageId", null);
                            String senderId = additionalData.optString("senderId", null);
                            if (messageId != null) {
                                Intent likeIntent = new Intent(MainActivity.this, NotificationLikeReceiver.class);
                                likeIntent.setAction("com.lifepartner.ai.ACTION_LIKE");
                                likeIntent.putExtra("messageId", messageId);
                                likeIntent.putExtra("senderId", senderId);
                                sendBroadcast(likeIntent);
                                return;
                            }
                        }
                    }

                    // For "reply" action, or regular notification tap (actionId == null / empty),
                    // or other actions, open the app directly to the conversation or target page
                    String targetPath = null;
                    if (additionalData != null) {
                        targetPath = additionalData.optString("targetPath", null);
                        if (targetPath == null || targetPath.isEmpty()) {
                            targetPath = additionalData.optString("route", null);
                        }
                        if (targetPath == null || targetPath.isEmpty()) {
                            String senderId = additionalData.optString("senderId", null);
                            if (senderId == null) senderId = additionalData.optString("connId", null);
                            if (senderId != null && !senderId.isEmpty()) {
                                targetPath = "/chat/" + senderId;
                            }
                        }
                        if (targetPath == null || targetPath.isEmpty()) {
                            String urlStr = additionalData.optString("url", null);
                            if (urlStr != null && !urlStr.isEmpty()) {
                                if (urlStr.startsWith("http")) {
                                    try {
                                        java.net.URI u = new java.net.URI(urlStr);
                                        targetPath = u.getPath() + (u.getQuery() != null ? "?" + u.getQuery() : "");
                                    } catch (Exception ignored) {}
                                } else {
                                    targetPath = urlStr;
                                }
                            }
                        }
                    }

                    if (targetPath == null || targetPath.isEmpty()) {
                        String launchUrl = event.getNotification().getLaunchURL();
                        if (launchUrl != null && !launchUrl.isEmpty()) {
                            try {
                                java.net.URI u = new java.net.URI(launchUrl);
                                targetPath = u.getPath() + (u.getQuery() != null ? "?" + u.getQuery() : "");
                            } catch (Exception ignored) {}
                        }
                    }

                    if (targetPath == null || targetPath.isEmpty()) {
                        targetPath = "/dashboard";
                    }

                    Log.d(TAG, "OneSignal opening app internally: " + targetPath);

                    Intent openIntent = new Intent(MainActivity.this, MainActivity.class);
                    openIntent.setPackage(getPackageName());
                    openIntent.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                    openIntent.putExtra("targetPath", targetPath);
                    openIntent.setData(android.net.Uri.parse("lifepartner://" + (targetPath.startsWith("/") ? targetPath.substring(1) : targetPath)));
                    startActivity(openIntent);
                } catch (Exception e) {
                    Log.e(TAG, "Error handling OneSignal click action: ", e);
                }
            });

            // Suppress foreground notifications if user is currently active in chat with the sender
            OneSignal.getNotifications().addForegroundLifecycleListener(event -> {
                try {
                    org.json.JSONObject additionalData = event.getNotification().getAdditionalData();
                    SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", MODE_PRIVATE);
                    String activeChatId = activeChatPartnerId != null ? activeChatPartnerId : prefs.getString("active_chat_id", null);

                    if (additionalData != null && activeChatId != null && !activeChatId.trim().isEmpty()) {
                        String senderId = additionalData.optString("senderId", "");
                        if (senderId.isEmpty()) senderId = additionalData.optString("connId", "");
                        if (senderId.isEmpty()) senderId = additionalData.optString("from", "");
                        if (senderId.isEmpty()) senderId = additionalData.optString("fromUserId", "");

                        if (!senderId.isEmpty()) {
                            String cleanActive = activeChatId.trim().toLowerCase();
                            String cleanSender = senderId.trim().toLowerCase();
                            if (cleanActive.equals(cleanSender) || cleanActive.contains(cleanSender) || cleanSender.contains(cleanActive)) {
                                Log.i(TAG, "OneSignal: User is actively chatting with " + senderId + ". Suppressing foreground notification.");
                                event.preventDefault();
                                return;
                            }
                        }
                    }

                    // If user is actively chatting in foreground, suppress incoming chat toasts to avoid disturbance
                    if (isAppInForeground && activeChatId != null && !activeChatId.trim().isEmpty()) {
                        String type = additionalData != null ? additionalData.optString("type", "") : "";
                        if ("message".equals(type) || "chat".equals(type) || type.isEmpty()) {
                            Log.i(TAG, "OneSignal: Suppressing message notification because user is active in conversation.");
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
                        prefs.edit().putString("onesignal_sub_id", subId).apply();
                        String authToken = prefs.getString("auth_token", null);
                        if (authToken != null && !authToken.trim().isEmpty() && !authToken.equalsIgnoreCase("null")) {
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

    private boolean isAllowedAppHost(String host) {
        if (host == null) return false;
        return host.equalsIgnoreCase("lifepartnerai.in") ||
               host.equalsIgnoreCase("www.lifepartnerai.in") ||
               host.endsWith(".lifepartnerai.in") ||
               host.equalsIgnoreCase("localhost") ||
               host.equalsIgnoreCase("10.0.2.2");
    }

    private boolean isGoogleOAuthHost(String host) {
        if (host == null) return false;
        return host.equalsIgnoreCase("accounts.google.com") ||
               host.equalsIgnoreCase("accounts.youtube.com") ||
               host.endsWith(".accounts.google.com");
    }

    private void launchCustomTabOrExternal(String rawUrl) {
        if (rawUrl == null || (!rawUrl.startsWith("https://") && !rawUrl.startsWith("http://"))) {
            return;
        }
        runOnUiThread(() -> {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(rawUrl));
                Bundle extras = new Bundle();
                extras.putBinder("android.support.customtabs.extra.SESSION", null);
                intent.putExtras(extras);
                intent.putExtra("android.support.customtabs.extra.TOOLBAR_COLOR", ContextCompat.getColor(this, R.color.colorPrimaryDark));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
            } catch (ActivityNotFoundException e) {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(rawUrl)));
                } catch (Exception ignored) {
                    Log.e(TAG, "Unable to launch external browser for URL: " + rawUrl);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error opening Custom Tab: ", e);
            }
        });
    }

    private void requestPushPermissionIfNeeded(boolean force) {
        try {
            SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", MODE_PRIVATE);
            if (prefs.getBoolean("push_disabled", false)) return;
            if (!force && pushPermissionPromptedThisSession) return;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
                OneSignal.getUser().getPushSubscription().optIn();
                return;
            }
            pushPermissionPromptedThisSession = true;
            OneSignal.getNotifications().requestPermission(true, com.onesignal.Continue.with(r -> {
                Log.d(TAG, "OneSignal native permission result: " + r.getData());
                if (Boolean.TRUE.equals(r.getData())) {
                    OneSignal.getUser().getPushSubscription().optIn();
                }
            }));
        } catch (Exception e) {
            Log.e(TAG, "Error requesting push permission: ", e);
        }
    }

    private void renderOfflineFallback(WebView view) {
        if (view == null) return;
        String html = "<!DOCTYPE html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'>" +
            "<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;" +
            "background:#0F172A;color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;padding:24px;}" +
            ".card{max-width:360px;width:100%;background:#1E293B;border:1px solid rgba(148,163,184,0.2);border-radius:24px;padding:28px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,0.4);}" +
            ".icon{width:56px;height:56px;margin:0 auto 16px;border-radius:16px;background:linear-gradient(135deg,#6366F1,#EC4899);display:flex;align-items:center;justify-content:center;font-size:28px;}" +
            "h2{margin:0 0 8px;font-size:20px;font-weight:800;}p{margin:0 0 20px;font-size:14px;color:#94A3B8;line-height:1.5;}" +
            "button{width:100%;padding:14px 20px;border:none;border-radius:14px;background:linear-gradient(135deg,#4F46E5,#EC4899);color:#fff;font-size:14px;font-weight:700;cursor:pointer;}</style></head>" +
            "<body><div class='card'><div class='icon'>&#10084;</div><h2>Connection Interrupted</h2>" +
            "<p>Unable to reach LifePartner AI right now. Check your internet connection and tap retry.</p>" +
            "<button onclick='window.AndroidBridge && window.AndroidBridge.retryConnection()'>Retry Connection</button></div></body></html>";
        runOnUiThread(() -> {
            try {
                view.loadDataWithBaseURL("https://www.lifepartnerai.in/", html, "text/html", "UTF-8", null);
            } catch (Exception e) {
                Log.e(TAG, "Failed to render offline fallback: ", e);
            }
        });
    }

    private void setupNativeBridge() {
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                NativeBridge bridge = new NativeBridge();
                // Inject both case conventions for 100% interoperability
                webView.addJavascriptInterface(bridge, "AndroidBridge");
                webView.addJavascriptInterface(bridge, "androidBridge");

                // Customize User-Agent so web detects native Android app 100% reliably
                android.webkit.WebSettings settings = webView.getSettings();
                String ua = settings.getUserAgentString();
                if (!ua.contains("LifePartnerApp")) {
                    settings.setUserAgentString(ua + " LifePartnerApp/1.0.7 CapacitorApp NativeAndroidApp");
                }

                // Smooth Native App rendering optimizations (disables web bounce and scrollbars)
                webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
                webView.setVerticalScrollBarEnabled(false);
                webView.setHorizontalScrollBarEnabled(false);
                webView.setBackgroundColor(0xFF0F172A);

                // DOM storage and caching
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);

                // Media playback & Full Video support without gesture restrictions
                settings.setMediaPlaybackRequiresUserGesture(false);
                settings.setAllowFileAccess(true);
                settings.setAllowContentAccess(true);
                settings.setJavaScriptCanOpenWindowsAutomatically(true);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error injecting AndroidBridge: ", e);
        }
    }

    private long lastBackPressTime = 0;

    public void setLandscapeModeInternal(boolean enableLandscape) {
        MainActivity.isLandscapeActive = enableLandscape;
        runOnUiThread(() -> {
            try {
                if (enableLandscape) {
                    setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
                    getWindow().getDecorView().setSystemUiVisibility(
                        View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    );
                } else {
                    setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
                    getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error setting landscape mode: ", e);
            }
        });
    }

    private void setupBackNavigationDispatcher() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (hideCustomFullscreenView()) {
                    return;
                }
                if (MainActivity.isLandscapeActive) {
                    setLandscapeModeInternal(false);
                    if (getBridge() != null && getBridge().getWebView() != null) {
                        getBridge().getWebView().evaluateJavascript("window.exitLandscapeMode && window.exitLandscapeMode()", null);
                    }
                    return;
                }
                handleAppBackNavigation();
            }
        });
    }

    @Override
    public void onBackPressed() {
        if (hideCustomFullscreenView()) {
            return;
        }
        if (MainActivity.isLandscapeActive) {
            setLandscapeModeInternal(false);
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().evaluateJavascript("window.exitLandscapeMode && window.exitLandscapeMode()", null);
            }
            return;
        }
        handleAppBackNavigation();
    }

    private void handleAppBackNavigation() {
        if (hideCustomFullscreenView()) {
            return;
        }
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();

                // Advanced single-page navigation & modal closing script
                String js = 
                    "(function() { " +
                    "  try { " +
                    "    // 1. Check for active modals, drawers, image viewers, sheets " +
                    "    var modalClose = document.querySelector('[data-modal-close], .close-modal, button[aria-label=\"Close\"], button[aria-label=\"close\"], [data-state=\"open\"] button[aria-label=\"Close\"], button[title=\"Close\"], .modal-close'); " +
                    "    if (modalClose && modalClose.offsetParent !== null) { modalClose.click(); return 'closed_modal'; } " +
                    "    // 2. Check for active chat close or back button " +
                    "    var chatClose = document.querySelector('[data-chat-close], .chat-window button[title=\"Close\"], .chat-window button[aria-label=\"Close\"], button[aria-label=\"Back\"]'); " +
                    "    if (chatClose && chatClose.offsetParent !== null) { chatClose.click(); return 'closed_chat'; } " +
                    "    // 3. Check current route pathname " +
                    "    var path = window.location.pathname; " +
                    "    var search = window.location.search || ''; " +
                    "    if (path !== '/' && path !== '/dashboard' && path !== '/login' && path !== '/register') { " +
                    "      if (window.history.length > 1) { " +
                    "        window.history.back(); " +
                    "        return 'navigated_history_back'; " +
                    "      } else { " +
                    "        window.location.href = '/dashboard'; " +
                    "        return 'redirected_dashboard'; " +
                    "      } " +
                    "    } " +
                    "    // 4. On /dashboard: if not on root home tab or if sub-view/chat is open, trigger popstate " +
                    "    var hasActiveSubView = document.querySelector('.chat-window, [data-active-chat=\"true\"], .chat-container, [data-profile-modal], .profile-modal, .story-viewer, [data-story-viewer]'); " +
                    "    var isHomeTab = (!search || search === '?tab=home' || search.indexOf('tab=home') !== -1) && !hasActiveSubView; " +
                    "    if (!isHomeTab) { " +
                    "      window.history.back(); " +
                    "      return 'dashboard_back'; " +
                    "    } " +
                    "    return 'at_root'; " +
                    "  } catch (e) { return 'error'; } " +
                    "})();";

                webView.evaluateJavascript(js, value -> {
                    String cleanVal = value != null ? value.replace("\"", "").trim() : "";

                    if ("closed_modal".equals(cleanVal) || 
                        "closed_chat".equals(cleanVal) || 
                        "navigated_history_back".equals(cleanVal) || 
                        "redirected_dashboard".equals(cleanVal) || 
                        "dashboard_back".equals(cleanVal)) {
                        // Handled by web app router/modal handler - do not close app
                        return;
                    }

                    runOnUiThread(() -> {
                        if (webView.canGoBack()) {
                            webView.goBack();
                        } else {
                            long now = System.currentTimeMillis();
                            if (now - lastBackPressTime < 2000) {
                                finish();
                            } else {
                                lastBackPressTime = now;
                                android.widget.Toast.makeText(MainActivity.this, "Press back again to exit", android.widget.Toast.LENGTH_SHORT).show();
                            }
                        }
                    });
                });
                return;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error handling back navigation: ", e);
        }
        super.onBackPressed();
    }

    private void setupWebViewAndChromeClients() {
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();

                // 1. WebViewClient: internal navigation stays in WebView, Google OAuth & external links open cleanly
                webView.setWebViewClient(new BridgeWebViewClient(getBridge()) {
                    @Override
                    public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                        super.onPageStarted(view, url, favicon);
                        if (url != null && !url.startsWith("about:") && !url.startsWith("data:")) {
                            try {
                                String host = Uri.parse(url).getHost();
                                if (isAllowedAppHost(host)) {
                                    lastLoadedOrFailedUrl = url;
                                }
                            } catch (Exception ignored) {}
                        }
                    }

                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                        if (request == null || request.getUrl() == null) return false;
                        Uri uri = request.getUrl();
                        String host = uri.getHost();
                        String scheme = uri.getScheme();

                        // Stay inside the WebView for all lifepartnerai.in domains, subdomains, and local dev
                        if (isAllowedAppHost(host)) {
                            return false;
                        }

                        // Open Google OAuth in Chrome Custom Tabs so Google Sign-In never hits disallowed_useragent
                        if (isGoogleOAuthHost(host)) {
                            launchCustomTabOrExternal(uri.toString());
                            return true;
                        }

                        // Handle standard external device protocols (phone calls, email, SMS, UPI payments, WhatsApp)
                        if ("tel".equalsIgnoreCase(scheme) || "mailto".equalsIgnoreCase(scheme) || "sms".equalsIgnoreCase(scheme) || "upi".equalsIgnoreCase(scheme) || "whatsapp".equalsIgnoreCase(scheme)) {
                            try {
                                Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                                startActivity(intent);
                            } catch (Exception e) {
                                Log.w(TAG, "No handler for scheme: " + scheme);
                            }
                            return true;
                        }

                        // Open external third-party HTTP(S) links in Custom Tabs / system browser
                        if ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme)) {
                            launchCustomTabOrExternal(uri.toString());
                            return true;
                        }

                        return super.shouldOverrideUrlLoading(view, request);
                    }

                    @Override
                    public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                        if (request != null && request.isForMainFrame()) {
                            int code = error != null ? error.getErrorCode() : 0;
                            if (code == WebViewClient.ERROR_UNSUPPORTED_SCHEME || code == -3) {
                                return;
                            }
                            if (request.getUrl() != null) {
                                lastLoadedOrFailedUrl = request.getUrl().toString();
                            }
                            renderOfflineFallback(view);
                            return;
                        }
                        super.onReceivedError(view, request, error);
                    }

                    @Override
                    public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
                        if (request != null && request.isForMainFrame() && errorResponse != null && errorResponse.getStatusCode() >= 500) {
                            if (request.getUrl() != null) {
                                lastLoadedOrFailedUrl = request.getUrl().toString();
                            }
                            renderOfflineFallback(view);
                            return;
                        }
                        super.onReceivedHttpError(view, request, errorResponse);
                    }
                });

                // 2. WebChromeClient: origin-verified just-in-time WebRTC permissions & safe target="_blank" routing
                webView.setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
                    @Override
                    public void onPermissionRequest(final PermissionRequest request) {
                        runOnUiThread(() -> {
                            try {
                                Uri origin = request.getOrigin();
                                String host = origin != null ? origin.getHost() : null;
                                if (!isAllowedAppHost(host)) {
                                    Log.w(TAG, "Denied WebView permission request from untrusted origin: " + origin);
                                    request.deny();
                                    return;
                                }

                                List<String> missingOsPermissions = new ArrayList<>();
                                for (String res : request.getResources()) {
                                    if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(res) &&
                                        ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                                        missingOsPermissions.add(Manifest.permission.CAMERA);
                                    } else if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(res) &&
                                        ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                                        missingOsPermissions.add(Manifest.permission.RECORD_AUDIO);
                                    }
                                }

                                if (!missingOsPermissions.isEmpty()) {
                                    if (pendingWebPermissionRequest != null) {
                                        try { pendingWebPermissionRequest.deny(); } catch (Exception ignored) {}
                                    }
                                    pendingWebPermissionRequest = request;
                                    ActivityCompat.requestPermissions(
                                        MainActivity.this,
                                        missingOsPermissions.toArray(new String[0]),
                                        WEB_PERMISSION_REQUEST_CODE
                                    );
                                    return;
                                }

                                grantPermittedWebResources(request);
                            } catch (Exception e) {
                                Log.e(TAG, "Error handling web permission request: ", e);
                                try { request.deny(); } catch (Exception ignored) {}
                            }
                        });
                    }

                    @Override
                    public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, android.os.Message resultMsg) {
                        WebView.HitTestResult result = view.getHitTestResult();
                        String data = result != null ? result.getExtra() : null;
                        if (data != null) {
                            if (data.startsWith("/")) {
                                view.loadUrl("https://www.lifepartnerai.in" + data);
                                return false;
                            }
                            try {
                                String dataHost = Uri.parse(data).getHost();
                                if (isAllowedAppHost(dataHost)) {
                                    view.loadUrl(data);
                                    return false;
                                } else {
                                    launchCustomTabOrExternal(data);
                                    return false;
                                }
                            } catch (Exception ignored) {}
                        }

                        WebView tempWebView = new WebView(MainActivity.this);
                        tempWebView.setWebViewClient(new WebViewClient() {
                            @Override
                            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
                                if (req != null && req.getUrl() != null) {
                                    String target = req.getUrl().toString();
                                    String targetHost = req.getUrl().getHost();
                                    if (isAllowedAppHost(targetHost)) {
                                        view.loadUrl(target);
                                    } else {
                                        launchCustomTabOrExternal(target);
                                    }
                                }
                                v.destroy();
                                return true;
                            }
                        });
                        WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                        transport.setWebView(tempWebView);
                        resultMsg.sendToTarget();
                        return true;
                    }

                    @Override
                    public void onShowCustomView(View view, CustomViewCallback callback) {
                        mActiveChromeClient = this;
                        showFullscreenVideoView(view, callback);
                    }

                    @Override
                    public void onShowCustomView(View view, int requestedOrientation, CustomViewCallback callback) {
                        mActiveChromeClient = this;
                        showFullscreenVideoView(view, callback);
                    }

                    @Override
                    public void onHideCustomView() {
                        mActiveChromeClient = this;
                        onHideCustomViewInternal();
                    }
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error setting custom WebView/ChromeClient: ", e);
        }
    }

    private void grantPermittedWebResources(PermissionRequest request) {
        if (request == null) return;
        List<String> granted = new ArrayList<>();
        for (String res : request.getResources()) {
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(res)) {
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                    granted.add(res);
                }
            } else if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(res)) {
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                    granted.add(res);
                }
            } else if (PermissionRequest.RESOURCE_PROTECTED_MEDIA_ID.equals(res)) {
                granted.add(res);
            }
        }
        if (granted.isEmpty()) {
            request.deny();
        } else {
            request.grant(granted.toArray(new String[0]));
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            Log.d(TAG, "Runtime permissions processed successfully.");
            setupNativeBridge();
            setupWebViewAndChromeClients();
        } else if (requestCode == WEB_PERMISSION_REQUEST_CODE) {
            PermissionRequest req = pendingWebPermissionRequest;
            pendingWebPermissionRequest = null;
            if (req != null) {
                runOnUiThread(() -> {
                    try {
                        grantPermittedWebResources(req);
                    } catch (Exception e) {
                        Log.e(TAG, "Error resolving pending web permission: ", e);
                        try { req.deny(); } catch (Exception ignored) {}
                    }
                });
            }
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
                if (subId == null || subId.isEmpty()) {
                    subId = prefs.getString("onesignal_sub_id", null);
                }
                if (subId != null && !subId.isEmpty()) {
                    sendOneSignalSubscriptionToBackend(subId, authToken);
                }

                // Poll in background for OneSignal subscription ID if it's still negotiating
                final String finalToken = authToken;
                new Thread(() -> {
                    for (int i = 0; i < 4; i++) {
                        try {
                            Thread.sleep(2000);
                            String currentSubId = OneSignal.getUser().getPushSubscription().getId();
                            if (currentSubId != null && !currentSubId.isEmpty()) {
                                prefs.edit().putString("onesignal_sub_id", currentSubId).apply();
                                sendOneSignalSubscriptionToBackend(currentSubId, finalToken);
                                break;
                            }
                        } catch (Exception ignored) {}
                    }
                }).start();
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
        public String getOneSignalSubId() {
            try {
                String subId = OneSignal.getUser().getPushSubscription().getId();
                if (subId == null || subId.isEmpty()) {
                    SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", MODE_PRIVATE);
                    subId = prefs.getString("onesignal_sub_id", "");
                }
                return subId != null ? subId : "";
            } catch (Exception e) {
                Log.e(TAG, "Error in getOneSignalSubId: ", e);
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
                    requestPushPermissionIfNeeded(false);
                    Log.d(TAG, "NativeBridge: Logged in OneSignal user: " + userId);

                    String authToken = prefs.getString("auth_token", null);
                    if (authToken != null && !authToken.trim().isEmpty() && !authToken.equalsIgnoreCase("null")) {
                        MyFirebaseMessagingService.registerTokenWithBackend(MainActivity.this, authToken);
                        String subId = OneSignal.getUser().getPushSubscription().getId();
                        if (subId == null || subId.isEmpty()) {
                            subId = prefs.getString("onesignal_sub_id", null);
                        }
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
                requestPushPermissionIfNeeded(true);
                fetchAndRegisterToken();
            } catch (Exception e) {
                Log.e(TAG, "Error in enablePush: ", e);
            }
        }

        @JavascriptInterface
        public void openInCustomTab(String url) {
            launchCustomTabOrExternal(url);
        }

        @JavascriptInterface
        public void retryConnection() {
            runOnUiThread(() -> {
                try {
                    if (getBridge() != null && getBridge().getWebView() != null) {
                        String target = (lastLoadedOrFailedUrl != null && !lastLoadedOrFailedUrl.isEmpty())
                            ? lastLoadedOrFailedUrl
                            : "https://www.lifepartnerai.in?app=native";
                        getBridge().getWebView().loadUrl(target);
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error retrying connection: ", e);
                }
            });
        }

        @JavascriptInterface
        public void setActiveChat(String partnerId) {
            MainActivity.activeChatPartnerId = (partnerId != null && !partnerId.trim().isEmpty() && !partnerId.equalsIgnoreCase("null")) ? partnerId.trim() : null;
            try {
                SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", MODE_PRIVATE);
                prefs.edit().putString("active_chat_id", MainActivity.activeChatPartnerId).apply();
                if (MainActivity.activeChatPartnerId != null) {
                    NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                    if (manager != null) {
                        for (String part : MainActivity.activeChatPartnerId.split(",")) {
                            if (!part.trim().isEmpty()) {
                                String clean = part.trim().toLowerCase();
                                prefs.edit().remove("chat_msg_history_" + clean).apply();
                                manager.cancel(Math.abs(clean.hashCode()));
                                manager.cancel(Math.abs(("chat_" + clean).hashCode()));
                            }
                        }
                    }
                }
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

        @JavascriptInterface
        public void showRewardedVideoAd() {
            showNativeRewardedAd();
        }

        @JavascriptInterface
        public boolean isRewardedAdReady() {
            return rewardedAd != null;
        }

        @JavascriptInterface
        public void setLandscapeMode(boolean enableLandscape) {
            setLandscapeModeInternal(enableLandscape);
        }
    }
}

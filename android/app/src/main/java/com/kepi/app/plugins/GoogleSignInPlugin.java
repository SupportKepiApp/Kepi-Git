package com.kepi.app.plugins;

import android.accounts.Account;
import android.accounts.AccountManager;
import android.app.Activity;
import android.content.Intent;
import android.util.Log;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.GoogleAuthUtil;
import com.google.android.gms.common.AccountPicker;

@CapacitorPlugin(name = "GoogleSignIn")
public class GoogleSignInPlugin extends Plugin {

    private static final String TAG = "GoogleSignInPlugin";
    // Android OAuth 2.0 Client ID (from Google Cloud Console > "KepiApp Android")
    private static final String SERVER_CLIENT_ID = "220213045781-4hakt6bp7c1geokjougi8lik77v6tuau.apps.googleusercontent.com";

    private PluginCall pendingCall;

    @PluginMethod
    public void signIn(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is null");
            return;
        }

        try {
            Intent pickerIntent = AccountPicker.newChooseAccountIntent(
                null,
                null,
                new String[]{"com.google"},
                true,
                null,
                null,
                null,
                null
            );
            pendingCall = call;
            startActivityForResult(call, pickerIntent, "onAccountPickerResult");
        } catch (Exception e) {
            Log.e(TAG, "AccountPicker failed", e);
            call.reject("Hesap seçici açılamadı: " + e.getMessage());
        }
    }

    // Capacitor 8.x @ActivityCallback signature: (PluginCall, ActivityResult) — exactly 2 args
    @ActivityCallback
    private void onAccountPickerResult(PluginCall call, ActivityResult result) {
        if (pendingCall == null) {
            return;
        }

        int resultCode = result.getResultCode();
        Intent data = result.getData();

        if (resultCode != Activity.RESULT_OK || data == null) {
            pendingCall.reject("Hesap seçimi iptal edildi");
            pendingCall = null;
            return;
        }

        String accountName = data.getStringExtra(AccountManager.KEY_ACCOUNT_NAME);
        if (accountName == null || accountName.isEmpty()) {
            pendingCall.reject("Hesap seçilmedi");
            pendingCall = null;
            return;
        }

        final Account account = new Account(accountName, "com.google");
        final PluginCall finalCall = pendingCall;
        pendingCall = null;

        new Thread(() -> {
            try {
                String scope = "audience:server:client_id:" + SERVER_CLIENT_ID;
                String idToken = GoogleAuthUtil.getToken(
                    getContext(),
                    account,
                    scope
                );

                JSObject ret = new JSObject();
                ret.put("idToken", idToken);
                finalCall.resolve(ret);
            } catch (Exception e) {
                Log.e(TAG, "getToken failed", e);
                finalCall.reject("Google token alınamadı: " + e.getMessage());
            }
        }).start();
    }
}

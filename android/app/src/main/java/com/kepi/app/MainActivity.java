package com.kepi.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.kepi.app.plugins.GoogleSignInPlugin;
import com.kepi.app.plugins.PlayBillingPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GoogleSignInPlugin.class);
        registerPlugin(PlayBillingPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

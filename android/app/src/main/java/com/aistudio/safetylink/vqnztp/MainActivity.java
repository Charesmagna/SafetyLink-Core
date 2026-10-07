package com.aistudio.safetylink.vqnztp;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(EmergencyDispatchPlugin.class);
        registerPlugin(SafetyLinkBridgePlugin.class);
        registerPlugin(ITagPlugin.class);
    }
}

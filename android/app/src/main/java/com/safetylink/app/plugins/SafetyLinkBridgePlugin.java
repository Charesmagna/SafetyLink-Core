package com.safetylink.app.plugins;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.safetylink.app.services.PanicService;

@CapacitorPlugin(name = "SafetyLinkEmergency")
public class SafetyLinkBridgePlugin extends Plugin {

    @PluginMethod
    public void trigger(PluginCall call) {
        String description = call.getString("description", "Software Trigger");
        
        Intent intent = new Intent(getContext(), PanicService.class);
        intent.setAction(PanicService.ACTION_TRIGGER_PANIC);
        intent.putExtra("description", description);
        
        // Start as foreground service to ensure Android doesn't kill it
        getContext().startForegroundService(intent);
        
        call.resolve();
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        Intent intent = new Intent(getContext(), PanicService.class);
        intent.setAction(PanicService.ACTION_CANCEL_PANIC);
        getContext().startService(intent);
        
        call.resolve();
    }
}

package com.example

import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import android.service.controls.Control
import android.service.controls.ControlsProviderService
import android.service.controls.DeviceTypes
import android.service.controls.actions.ControlAction
import android.service.controls.templates.StatelessTemplate
import android.util.Log
import androidx.annotation.RequiresApi
import java.util.concurrent.Flow
import java.util.function.Consumer

/**
 * SafetyLinkControlsProvider
 *
 * Implements Android 11+ Device Controls panel (Settings > Device Controls).
 * Exposes a quick stateless "SOS Panic" trigger accessible directly from the device power menu/controls panel.
 * Requires BIND_CONTROLS permission.
 * Reference: Manifest.permission.BIND_CONTROLS from https://developer.android.com/reference/android/Manifest.permission
 */
@RequiresApi(Build.VERSION_CODES.R)
class SafetyLinkControlsProvider : ControlsProviderService() {

    override fun createPublisherForAllAvailable(): Flow.Publisher<Control> {
        return Flow.Publisher { subscriber ->
            val control = buildControl("sos_panic", "SOS Panic", "Trigger Distress Chain")
            subscriber.onSubscribe(object : Flow.Subscription {
                override fun request(n: Long) {
                    if (n > 0) {
                        subscriber.onNext(control)
                        subscriber.onComplete()
                    }
                }
                override fun cancel() {
                    Log.d("SafetyLinkControls", "createPublisherForAllAvailable subscription cancelled.")
                }
            })
        }
    }

    override fun createPublisherFor(controlIds: MutableList<String>): Flow.Publisher<Control> {
        return Flow.Publisher { subscriber ->
            subscriber.onSubscribe(object : Flow.Subscription {
                override fun request(n: Long) {
                    if (n > 0) {
                        for (id in controlIds) {
                            if (id == "sos_panic") {
                                subscriber.onNext(buildControl(id, "SOS Panic", "Trigger Distress Chain"))
                            }
                        }
                        subscriber.onComplete()
                    }
                }
                override fun cancel() {
                    Log.d("SafetyLinkControls", "createPublisherFor subscription cancelled.")
                }
            })
        }
    }

    override fun performControlAction(
        controlId: String,
        action: ControlAction,
        consumer: Consumer<Int>
    ) {
        Log.i("SafetyLinkControls", "Control action requested on: $controlId")
        if (controlId == "sos_panic") {
            try {
                // Ensure service starts
                val serviceIntent = Intent(this, SafetyBackgroundService::class.java).apply {
                    this.action = SafetyBackgroundService.ACTION_START
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(serviceIntent)
                } else {
                    startService(serviceIntent)
                }

                // Launch main activity with panic action
                val panicIntent = Intent(this, MainActivity::class.java).apply {
                    this.action = "com.example.ACTION_PANIC"
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                }
                startActivity(panicIntent)

                consumer.accept(ControlAction.RESPONSE_OK)
                Log.i("SafetyLinkControls", "Control action accepted. MainActivity triggered with ACTION_PANIC.")
            } catch (e: Exception) {
                Log.e("SafetyLinkControls", "Failed to trigger panic action from controls: ${e.message}", e)
                consumer.accept(ControlAction.RESPONSE_FAIL)
            }
        } else {
            consumer.accept(ControlAction.RESPONSE_FAIL)
        }
    }

    private fun buildControl(id: String, title: String, subtitle: String): Control {
        val intent = Intent(this, MainActivity::class.java).apply {
            action = "com.example.ACTION_PANIC"
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return Control.Builder(id, pendingIntent)
            .setTitle(title)
            .setSubtitle(subtitle)
            .setDeviceType(DeviceTypes.TYPE_ROUTINE)
            .setStructure("SafetyLink Core")
            .setStatus(Control.STATUS_OK)
            .setControlTemplate(StatelessTemplate(id))
            .build()
    }
}

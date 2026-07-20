package com.example

import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import android.service.controls.Control
import android.service.controls.ControlsProviderService
import android.service.controls.actions.ControlAction
import android.util.Log
import androidx.annotation.RequiresApi
import java.util.concurrent.Flow.Publisher
import java.util.concurrent.Flow.Subscriber
import java.util.concurrent.Flow.Subscription

// Reference: https://developer.android.com/reference/android/Manifest.permission#BIND_CONTROLS
@RequiresApi(Build.VERSION_CODES.R)
class SafetyLinkControlsProvider : ControlsProviderService() {

    companion object {
        const val CONTROL_ID_SOS = "safetylink_sos_control"
    }

    override fun createPublisherForAllAvailable(): Publisher<Control> {
        return Publisher { subscriber ->
            subscriber.onSubscribe(object : Subscription {
                override fun request(n: Long) {}
                override fun cancel() {}
            })
            subscriber.onNext(createSOSControl())
            subscriber.onComplete()
        }
    }

    override fun createPublisherFor(controlIds: MutableList<String>): Publisher<Control> {
        return Publisher { subscriber ->
            subscriber.onSubscribe(object : Subscription {
                override fun request(n: Long) {}
                override fun cancel() {}
            })
            if (controlIds.contains(CONTROL_ID_SOS)) {
                subscriber.onNext(createSOSControl())
            }
            subscriber.onComplete()
        }
    }

    override fun performControlAction(
        controlId: String,
        action: ControlAction,
        consumer: java.util.function.Consumer<Int>
    ) {
        if (controlId == CONTROL_ID_SOS) {
            Log.d("SafetyLinkControls", "SOS Control Triggered")
            
            val panicIntent = Intent(this, MainActivity::class.java).apply {
                this.action = "com.example.ACTION_PANIC"
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            }
            try {
                startActivity(panicIntent)
            } catch (e: Exception) {
                Log.e("SafetyLinkControls", "Failed to start MainActivity", e)
            }
            
            consumer.accept(ControlAction.RESPONSE_OK)
        } else {
            consumer.accept(ControlAction.RESPONSE_FAIL)
        }
    }

    private fun createSOSControl(): Control {
        val intent = Intent(this, MainActivity::class.java).apply {
            action = "com.example.ACTION_PANIC"
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return Control.StatelessBuilder(CONTROL_ID_SOS, pendingIntent)
            .setTitle("SOS Panic")
            .setSubtitle("SafetyLink")
            .setCustomIcon(android.graphics.drawable.Icon.createWithResource(this, android.R.drawable.ic_lock_lock))
            .build()
    }
}

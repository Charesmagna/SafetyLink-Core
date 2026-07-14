package com.example

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Log
import androidx.core.content.FileProvider
import java.io.File

/**
 * FileProviderUtil
 *
 * Provides a secure mechanism for sharing audit logs and evidence exports with third parties or responders
 * using Content URIs instead of file:// URIs, adhering to Android security standards.
 * Reference: androidx.core.content.FileProvider
 */
object FileProviderUtil {

    /**
     * Creates an ACTION_SEND chooser intent to share the specified log file securely.
     */
    fun shareAuditLog(context: Context, file: File) {
        if (!file.exists()) {
            Log.e("FileProviderUtil", "File to share does not exist: ${file.absolutePath}")
            return
        }

        try {
            val authority = "${context.packageName}.file.provider"
            val uri: Uri = FileProvider.getUriForFile(context, authority, file)

            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            val chooserIntent = Intent.createChooser(shareIntent, "Export SafetyLink Audit Logs/Evidence").apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            context.startActivity(chooserIntent)
            Log.i("FileProviderUtil", "Successfully launched secure file sharing intent for ${file.name}")
        } catch (e: Exception) {
            Log.e("FileProviderUtil", "Failed to create secure file sharing link: ${e.message}", e)
        }
    }
}


package com.aistudio.safetylink.vqnztp.security

import android.content.Context
import androidx.security.crypto.EncryptedFile
import androidx.security.crypto.MasterKey
import java.io.File

object SecurityUtils {
    fun getMasterKey(context: Context): MasterKey {
        return MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
    }

    fun getEncryptedFile(context: Context, file: File): EncryptedFile {
        return EncryptedFile.Builder(
            context,
            file,
            getMasterKey(context),
            EncryptedFile.FileEncryptionScheme.AES256_GCM_HKDF_4KB
        ).build()
    }
}

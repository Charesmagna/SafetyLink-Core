package com.aistudio.safetylink.vqnztp.ui

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

object NtfySseClient {
    fun subscribe(topic: String): Flow<String> = flow {
        var connection: HttpURLConnection? = null
        try {
            val url = URL("https://ntfy.sh/$topic/sse")
            connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "GET"
            connection.setRequestProperty("Accept", "text/event-stream")
            
            val inputStream = connection.inputStream
            val reader = BufferedReader(InputStreamReader(inputStream))
            
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                if (line?.startsWith("data: ") == true) {
                    val data = line?.substring(6) ?: ""
                    emit(data)
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            connection?.disconnect()
        }
    }.flowOn(Dispatchers.IO)
}

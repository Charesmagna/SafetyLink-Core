package com.safetylink

import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.material3.Button

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainHeader() {
    TopAppBar(
        title = { Text("SafetyLink") },
        actions = {
            Button(onClick = { /* Set EN */ }) { Text("EN") }
            Button(onClick = { /* Set ZU */ }) { Text("ZU") }
            Button(onClick = { /* Set AF */ }) { Text("AF") }
        }
    )
}

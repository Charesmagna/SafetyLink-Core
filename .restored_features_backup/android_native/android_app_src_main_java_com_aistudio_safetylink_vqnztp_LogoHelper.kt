package com.aistudio.safetylink.vqnztp

import android.widget.ImageView
import coil.load
import java.net.URLEncoder

/**
 * Loads a company logo by name into an ImageView using Logo.dev.
 * Automatically URL-encodes the company name to preserve spaces and symbols.
 */
fun loadCompanyLogoByName(companyName: String, imageView: ImageView) {
    val encodedName = URLEncoder.encode(companyName, "UTF-8")
    val publishableToken = "pk_RtPnjqevRSC9dej8_-4i6A"
    
    // We request PNG format and a size of 256px as standard parameters
    val logoUrl = "https://img.logo.dev/name/$encodedName?token=$publishableToken&format=png&size=256"
    
    imageView.load(logoUrl) {
        crossfade(true)
    }
}

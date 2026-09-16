package com.safetylink

object PanicRouter {
    fun sendPanic(data: Map<String, Any>) {
        val hasInternet = true
        val hasMoya = false
        if (hasInternet) {
            // api.postPanic(data)
        } else if (hasMoya) {
            // openMoyaShare(data) // moya://share?text=
        } else {
            // sendSMS()
        }
        // After success, schedule LizzyPopup in 2min
    }
}

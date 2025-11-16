package cz.vokounova.configurator.shared.utils

import java.security.MessageDigest

fun String.getMd5Hash(): String {
    val md5Hash = MessageDigest.getInstance("MD5")

    val byteArray = md5Hash.digest(this.toByteArray(Charsets.UTF_8))
    return buildString {
        for (byte in byteArray) {
            append(String.format("%02x", byte))
        }
    }
}

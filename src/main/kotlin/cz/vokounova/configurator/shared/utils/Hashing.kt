package cz.vokounova.configurator.shared.utils

import java.security.MessageDigest

/**
 * Create String MD5 hash
 *
 * Current VOGT implementation https://git.applifting.cz/vogt/old-source-code/-/blob/main/Backend%20Software/dll_Common/Source/Utilities.cs?ref_type=heads#L116
 *
 * @return the new string
 */
fun String.getMd5Hash(): String {
    val md5Hash = MessageDigest.getInstance("MD5")

    val byteArray = md5Hash.digest(this.toByteArray(Charsets.UTF_8))
    return buildString {
        for (byte in byteArray) {
            append(String.format("%02x", byte))
        }
    }
}

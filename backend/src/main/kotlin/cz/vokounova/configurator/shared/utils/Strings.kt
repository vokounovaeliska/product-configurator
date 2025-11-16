package cz.vokounova.configurator.shared.utils

/**
 * Converts snake case string to camel case
 * @return the new string
 */
fun String.snakeToCamelCase(): String {
    val pattern = "_[a-z]".toRegex()
    return replace(pattern) { it.value.last().uppercase() }
}

fun valueOrEmpty(value: String?) = value ?: ""

fun normalizeStringInput(input: String?): String? =
    input
        ?.trim()
        ?.ifBlank { null }

fun hexStringToByteArray(value: String): ByteArray =
    value
        .removePrefix("0x")
        .chunked(2)
        .map { it.toInt(16).toByte() }
        .toByteArray()

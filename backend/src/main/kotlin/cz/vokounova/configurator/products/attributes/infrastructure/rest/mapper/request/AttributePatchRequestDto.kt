package cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonValue

enum class AttributePatchRequestDtoPath(val pathValue: String) {
    SlashCode("/code"),
    SlashLabel("/label"),
    SlashType("/type"),
    SlashIsRequired("/isRequired"),
    SlashMinInt("/minInt"),
    SlashMaxInt("/maxInt"),
    SlashMinDecimal("/minDecimal"),
    SlashMaxDecimal("/maxDecimal"),
    SlashDefaultInt("/defaultInt"),
    SlashDefaultDecimal("/defaultDecimal"),
    SlashUnit("/unit"),
    SlashSortOrder("/sortOrder"),
    ;

    @JsonValue
    fun toPathValue(): String = pathValue

    companion object {
        @JvmStatic
        @JsonCreator
        fun fromPathValue(value: String): AttributePatchRequestDtoPath =
            entries.firstOrNull { it.pathValue == value }
                ?: throw IllegalArgumentException("Unknown attribute patch path: $value")
    }
}

enum class AttributePatchRequestDtoOp {
    Replace,
}

data class AttributePatchRequestDto(
    val path: AttributePatchRequestDtoPath,
    val value: Any?,
    val op: AttributePatchRequestDtoOp,
)

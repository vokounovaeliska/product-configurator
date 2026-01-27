package cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request

enum class AttributePatchRequestDtoPath {
    SlashCode,
    SlashLabel,
    SlashType,
    SlashIsRequired,
    SlashMinInt,
    SlashMaxInt,
    SlashMinDecimal,
    SlashMaxDecimal,
    SlashSortOrder,
}

enum class AttributePatchRequestDtoOp {
    Replace,
}

data class AttributePatchRequestDto(
    val path: AttributePatchRequestDtoPath,
    val value: Any?,
    val op: AttributePatchRequestDtoOp,
)

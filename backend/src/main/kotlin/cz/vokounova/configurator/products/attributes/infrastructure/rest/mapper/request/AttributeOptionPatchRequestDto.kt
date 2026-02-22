package cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request

enum class AttributeOptionPatchRequestDtoPath {
    SlashValue,
    SlashLabel,
    SlashImageUrl,
    SlashColorHex,
    SlashSortOrder,
}

enum class AttributeOptionPatchRequestDtoOp {
    Replace,
}

data class AttributeOptionPatchRequestDto(
    val path: AttributeOptionPatchRequestDtoPath,
    val value: Any?,
    val op: AttributeOptionPatchRequestDtoOp,
)

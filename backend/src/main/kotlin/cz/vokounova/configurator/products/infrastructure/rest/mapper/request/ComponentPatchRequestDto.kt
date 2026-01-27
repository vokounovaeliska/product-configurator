package cz.vokounova.configurator.products.infrastructure.rest.mapper.request

enum class ComponentPatchRequestDtoPath {
    SlashCode,
    SlashLabel,
    SlashDescription,
    SlashSortOrder,
}

enum class ComponentPatchRequestDtoOp {
    Replace,
}

data class ComponentPatchRequestDto(
    val path: ComponentPatchRequestDtoPath,
    val value: Any?,
    val op: ComponentPatchRequestDtoOp,
)

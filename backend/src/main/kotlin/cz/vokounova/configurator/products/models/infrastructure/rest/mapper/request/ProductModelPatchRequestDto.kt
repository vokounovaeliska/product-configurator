package cz.vokounova.configurator.products.models.infrastructure.rest.mapper.request

data class ProductModelPatchRequestDto(
    val path: Path,
    val value: Any?,
    val op: Op,
) {
    enum class Path {
        SlashName,
        SlashDescription,
        SlashPrice,
        SlashCurrency,
        SlashIsActive,
        SlashModel3dUrl,
    }

    enum class Op {
        Replace,
    }
}

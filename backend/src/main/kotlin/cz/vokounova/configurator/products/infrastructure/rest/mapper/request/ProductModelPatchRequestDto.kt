package cz.vokounova.configurator.products.infrastructure.rest.mapper.request

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
    }

    enum class Op {
        Replace,
    }
}

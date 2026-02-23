package cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request

data class AttributeOptionCreateRequestDto(
    val value: String,
    val label: String,
    val imageUrl: String? = null,
    val colorHex: String? = null,
    val sortOrder: Int? = null,
)

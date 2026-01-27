package cz.vokounova.configurator.products.infrastructure.rest.mapper.request

data class ProductModelCreateRequestDto(
    val name: String,
    val description: String? = null,
    val price: Double? = null,
    val currency: String? = null,
    val isActive: Boolean? = null,
)

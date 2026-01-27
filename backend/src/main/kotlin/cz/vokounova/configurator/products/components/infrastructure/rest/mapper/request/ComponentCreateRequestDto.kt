package cz.vokounova.configurator.products.components.infrastructure.rest.mapper.request

data class ComponentCreateRequestDto(
    val code: String,
    val label: String,
    val description: String? = null,
    val sortOrder: Int? = null,
)

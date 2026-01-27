package cz.vokounova.configurator.products.domain

data class ComponentFilter(
    val productModelIds: List<ProductModelId>? = null,
    val ids: List<ComponentId>? = null,
)

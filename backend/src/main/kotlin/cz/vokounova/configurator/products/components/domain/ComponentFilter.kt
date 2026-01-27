package cz.vokounova.configurator.products.components.domain

import cz.vokounova.configurator.products.models.domain.ProductModelId

data class ComponentFilter(
    val productModelIds: List<ProductModelId>? = null,
    val ids: List<ComponentId>? = null,
)

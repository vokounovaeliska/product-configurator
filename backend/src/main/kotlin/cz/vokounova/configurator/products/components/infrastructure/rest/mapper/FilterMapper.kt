package cz.vokounova.configurator.products.components.infrastructure.rest.mapper

import cz.vokounova.configurator.products.components.domain.ComponentFilter
import cz.vokounova.configurator.products.components.domain.ComponentId
import cz.vokounova.configurator.products.components.infrastructure.rest.request.ComponentListQueryParams
import cz.vokounova.configurator.products.models.domain.ProductModelId

fun ComponentListQueryParams.toFilter(): ComponentFilter =
    ComponentFilter(
        productModelIds = productModelIds?.map { ProductModelId(it) },
        ids = ids?.map { ComponentId(it) },
    )

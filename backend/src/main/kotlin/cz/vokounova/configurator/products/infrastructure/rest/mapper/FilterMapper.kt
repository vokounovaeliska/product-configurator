package cz.vokounova.configurator.products.infrastructure.rest.mapper

import cz.vokounova.configurator.products.domain.ComponentFilter
import cz.vokounova.configurator.products.domain.ComponentId
import cz.vokounova.configurator.products.domain.ProductModelId
import cz.vokounova.configurator.products.infrastructure.rest.request.ComponentListQueryParams
import java.util.UUID

fun ComponentListQueryParams.toFilter(): ComponentFilter =
    ComponentFilter(
        productModelIds = productModelIds?.map { ProductModelId(it) },
        ids = ids?.map { ComponentId(it) },
    )

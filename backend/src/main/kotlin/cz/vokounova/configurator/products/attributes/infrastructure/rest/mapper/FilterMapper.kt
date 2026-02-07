package cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper

import cz.vokounova.configurator.products.attributes.domain.AttributeFilter
import cz.vokounova.configurator.products.attributes.domain.AttributeId
import cz.vokounova.configurator.products.attributes.infrastructure.rest.request.AttributeListQueryParams
import cz.vokounova.configurator.products.components.domain.ComponentId

fun AttributeListQueryParams.toFilter(): AttributeFilter =
    AttributeFilter(
        componentIds = componentIds?.map { ComponentId(it) },
        ids = ids?.map { AttributeId(it) },
        types = types,
    )

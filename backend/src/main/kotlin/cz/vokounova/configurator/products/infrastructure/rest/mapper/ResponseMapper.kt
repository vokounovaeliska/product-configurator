package cz.vokounova.configurator.products.infrastructure.rest.mapper

import cz.vokounova.configurator.products.domain.Component
import cz.vokounova.configurator.products.infrastructure.rest.mapper.response.ComponentDto

fun Component.toDto(): ComponentDto =
    ComponentDto(
        id = id.value,
        productModelId = productModelId.value,
        code = code,
        label = label,
        description = description,
        sortOrder = sortOrder,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
    )

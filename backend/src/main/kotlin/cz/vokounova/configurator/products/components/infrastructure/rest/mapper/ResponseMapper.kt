package cz.vokounova.configurator.products.components.infrastructure.rest.mapper

import cz.vokounova.configurator.products.components.domain.Component
import cz.vokounova.configurator.products.components.infrastructure.rest.mapper.response.ComponentDto

fun Component.toDto(): ComponentDto =
    ComponentDto(
        id = id.value,
        productModelId = productModelId.value,
        code = code,
        label = label,
        description = description,
        sortOrder = sortOrder,
        imageZIndex = imageZIndex,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
    )

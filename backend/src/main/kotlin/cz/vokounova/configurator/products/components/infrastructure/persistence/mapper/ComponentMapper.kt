package cz.vokounova.configurator.products.components.infrastructure.persistence.mapper

import cz.vokounova.configurator.generated.jooq.tables.records.ComponentDefinitionRecord
import cz.vokounova.configurator.products.components.domain.Component
import cz.vokounova.configurator.products.components.domain.ComponentId
import cz.vokounova.configurator.products.models.domain.ProductModelId

fun Component.toPersistence(): ComponentDefinitionRecord =
    ComponentDefinitionRecord(
        id = id.value,
        productModelId = productModelId.value,
        code = code,
        label = label,
        description = description,
        sortOrder = sortOrder,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
    )

fun ComponentDefinitionRecord.toDomain(): Component =
    Component(
        id = ComponentId(id),
        productModelId = ProductModelId(productModelId),
        code = code,
        label = label,
        description = description,
        sortOrder = sortOrder ?: 0,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
    )

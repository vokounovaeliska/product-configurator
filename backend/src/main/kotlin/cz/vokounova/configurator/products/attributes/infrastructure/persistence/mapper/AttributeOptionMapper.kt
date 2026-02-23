package cz.vokounova.configurator.products.attributes.infrastructure.persistence.mapper

import cz.vokounova.configurator.generated.jooq.tables.records.AttributeOptionRecord
import cz.vokounova.configurator.products.attributes.domain.AttributeId
import cz.vokounova.configurator.products.attributes.domain.AttributeOption
import cz.vokounova.configurator.products.attributes.domain.AttributeOptionId

fun AttributeOption.toPersistence(): AttributeOptionRecord =
    AttributeOptionRecord(
        id = id.value,
        attributeId = attributeId.value,
        value = value,
        label = label,
        imageUrl = imageUrl,
        sortOrder = sortOrder,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
        colorHex = colorHex,
    )

fun AttributeOptionRecord.toDomain(): AttributeOption =
    AttributeOption(
        id = AttributeOptionId(id),
        attributeId = AttributeId(attributeId),
        value = value,
        label = label,
        imageUrl = imageUrl,
        colorHex = colorHex,
        sortOrder = sortOrder ?: 0,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
    )

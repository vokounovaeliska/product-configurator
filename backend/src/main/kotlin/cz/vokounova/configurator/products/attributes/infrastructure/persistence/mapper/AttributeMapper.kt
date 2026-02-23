package cz.vokounova.configurator.products.attributes.infrastructure.persistence.mapper

import cz.vokounova.configurator.generated.jooq.tables.records.AttributeDefinitionRecord
import cz.vokounova.configurator.products.attributes.domain.Attribute
import cz.vokounova.configurator.products.attributes.domain.AttributeId
import cz.vokounova.configurator.products.components.domain.ComponentId

fun Attribute.toPersistence(): AttributeDefinitionRecord =
    AttributeDefinitionRecord(
        id = id.value,
        componentId = componentId.value,
        code = code,
        label = label,
        type = type,
        isRequired = isRequired,
        minInt = minInt,
        maxInt = maxInt,
        minDecimal = minDecimal,
        maxDecimal = maxDecimal,
        sortOrder = sortOrder,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
        unit = unit,
        defaultInt = defaultInt,
        defaultDecimal = defaultDecimal,
    )

fun AttributeDefinitionRecord.toDomain(): Attribute =
    Attribute(
        id = AttributeId(id),
        componentId = ComponentId(componentId),
        code = code,
        label = label,
        type = type,
        isRequired = isRequired ?: true,
        minInt = minInt,
        maxInt = maxInt,
        minDecimal = minDecimal,
        maxDecimal = maxDecimal,
        defaultInt = defaultInt,
        defaultDecimal = defaultDecimal,
        unit = unit,
        sortOrder = sortOrder ?: 0,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
    )

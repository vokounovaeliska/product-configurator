package cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper

import cz.vokounova.configurator.products.attributes.domain.Attribute
import cz.vokounova.configurator.products.attributes.domain.AttributeOption
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.response.AttributeDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.response.AttributeOptionDto

fun Attribute.toDto(): AttributeDto =
    AttributeDto(
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
    )

fun AttributeOption.toDto(): AttributeOptionDto =
    AttributeOptionDto(
        id = id.value,
        attributeId = attributeId.value,
        value = value,
        label = label,
        imageUrl = imageUrl,
        sortOrder = sortOrder,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
    )

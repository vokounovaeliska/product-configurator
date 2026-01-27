package cz.vokounova.configurator.products.infrastructure.rest.mapper

import cz.vokounova.configurator.products.domain.ProductModel
import cz.vokounova.configurator.products.infrastructure.rest.mapper.response.ProductModelDto

/**
 * Maps domain ProductModel to external Dto
 */
fun ProductModel.toDto(): ProductModelDto =
    ProductModelDto(
        id = id.value,
        userId = userId.value,
        name = name,
        description = description,
        price = price,
        currency = currency,
        isActive = isActive,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
    )

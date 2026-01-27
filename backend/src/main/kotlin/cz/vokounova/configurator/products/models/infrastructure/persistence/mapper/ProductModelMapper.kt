package cz.vokounova.configurator.products.models.infrastructure.persistence.mapper

import cz.vokounova.configurator.generated.jooq.tables.records.ProductModelRecord
import cz.vokounova.configurator.products.models.domain.ProductModel
import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.users.api.dto.UserIdDto
import java.math.BigDecimal

fun ProductModel.toPersistence(): ProductModelRecord =
    ProductModelRecord(
        id = id.value,
        userId = userId.value,
        name = name,
        description = description,
        price = BigDecimal.valueOf(price),
        currency = currency,
        isActive = isActive,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
    )

fun ProductModelRecord.toDomain(): ProductModel =
    ProductModel(
        id = ProductModelId(id),
        userId = UserIdDto(userId),
        name = name,
        description = description,
        price = price?.toDouble() ?: 0.0,
        currency = currency ?: "CZK",
        isActive = isActive ?: true,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
    )

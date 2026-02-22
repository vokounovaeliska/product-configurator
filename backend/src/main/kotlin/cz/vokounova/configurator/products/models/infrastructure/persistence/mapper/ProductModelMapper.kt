package cz.vokounova.configurator.products.models.infrastructure.persistence.mapper

import cz.vokounova.configurator.generated.jooq.tables.records.ProductModelRecord
import cz.vokounova.configurator.products.models.domain.ProductModel
import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.users.api.dto.UserIdDto
import org.jooq.impl.DSL
import org.jooq.impl.SQLDataType
import java.math.BigDecimal

private val MODEL_3D_URL_FIELD = DSL.field(DSL.name("model_3d_url"), SQLDataType.VARCHAR)

fun ProductModel.toPersistence(): ProductModelRecord {
    val record =
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
    model3dUrl?.let { record.set(MODEL_3D_URL_FIELD, it) }
    return record
}

fun ProductModelRecord.toDomain(model3dUrlOverride: String? = null): ProductModel =
    ProductModel(
        id = ProductModelId(id),
        userId = UserIdDto(userId),
        name = name,
        description = description,
        price = price?.toDouble() ?: 0.0,
        currency = currency ?: "CZK",
        isActive = isActive ?: true,
        model3dUrl = model3dUrlOverride ?: this[MODEL_3D_URL_FIELD],
        createdAt = createdAt,
        modifiedAt = modifiedAt,
    )

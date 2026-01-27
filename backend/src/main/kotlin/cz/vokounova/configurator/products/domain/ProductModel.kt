package cz.vokounova.configurator.products.domain

import cz.vokounova.configurator.users.api.dto.UserIdDto
import java.time.OffsetDateTime
import java.util.UUID

@JvmInline
value class ProductModelId(
    val value: UUID,
)

data class ProductModel(
    val id: ProductModelId,
    val userId: UserIdDto,
    val name: String,
    val description: String?,
    val price: Double,
    val currency: String,
    val isActive: Boolean,
    val createdAt: OffsetDateTime,
    val modifiedAt: OffsetDateTime,
) {
    companion object {
        val ALLOWED_CURRENCIES = listOf("CZK", "EUR", "USD", "GBP")

        fun create(params: ProductModelCreateParams): ProductModel {
            val timestamp = OffsetDateTime.now()
            return ProductModel(
                id = ProductModelId(UUID.randomUUID()),
                userId = params.userId,
                name = params.name,
                description = params.description,
                price = params.price ?: 0.0,
                currency = params.currency ?: "CZK",
                isActive = params.isActive ?: true,
                createdAt = timestamp,
                modifiedAt = timestamp,
            )
        }
    }
}

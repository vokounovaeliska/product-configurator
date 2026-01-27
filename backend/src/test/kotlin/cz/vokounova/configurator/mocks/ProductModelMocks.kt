package cz.vokounova.configurator.mocks

import cz.vokounova.configurator.products.models.domain.ProductModel
import cz.vokounova.configurator.products.models.domain.ProductModelCreateParams
import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.users.api.dto.UserIdDto
import java.time.OffsetDateTime
import java.util.UUID

object ProductModelMocks {
    private val USER_ID = UserIdDto(UUID.fromString("a1b16dcb-b885-4783-b085-358a97e7e71e"))

    fun getProductModel(
        id: ProductModelId = ProductModelId(UUID.randomUUID()),
        userId: UserIdDto = USER_ID,
        name: String = "Test Table",
        description: String? = "A test table description",
        price: Double = 1500.00,
        currency: String = "CZK",
        isActive: Boolean = true,
        createdAt: OffsetDateTime = OffsetDateTime.now(),
        modifiedAt: OffsetDateTime = OffsetDateTime.now(),
    ) = ProductModel(
        id = id,
        userId = userId,
        name = name,
        description = description,
        price = price,
        currency = currency,
        isActive = isActive,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
    )

    fun getProductModelCreateParams(
        userId: UserIdDto = USER_ID,
        name: String = "Test Table",
        description: String? = "A test table description",
        price: Double? = 1500.00,
        currency: String? = "CZK",
        isActive: Boolean? = true,
    ) = ProductModelCreateParams(
        userId = userId,
        name = name,
        description = description,
        price = price,
        currency = currency,
        isActive = isActive,
    )
}

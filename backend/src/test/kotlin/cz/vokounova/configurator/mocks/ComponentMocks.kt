package cz.vokounova.configurator.mocks

import cz.vokounova.configurator.products.components.domain.Component
import cz.vokounova.configurator.products.components.domain.ComponentCreateParams
import cz.vokounova.configurator.products.components.domain.ComponentId
import cz.vokounova.configurator.products.models.domain.ProductModelId
import java.time.OffsetDateTime
import java.util.UUID

object ComponentMocks {
    private val PRODUCT_MODEL_ID = ProductModelId(UUID.fromString("11111111-1111-1111-1111-111111111111"))

    fun getComponent(
        id: ComponentId = ComponentId(UUID.randomUUID()),
        productModelId: ProductModelId = PRODUCT_MODEL_ID,
        code: String = "TOP",
        label: String = "Table Top",
        description: String? = "The top surface of the table",
        sortOrder: Int = 1,
        createdAt: OffsetDateTime = OffsetDateTime.now(),
        modifiedAt: OffsetDateTime = OffsetDateTime.now(),
    ) = Component(
        id = id,
        productModelId = productModelId,
        code = code,
        label = label,
        description = description,
        sortOrder = sortOrder,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
    )

    fun getComponentCreateParams(
        productModelId: ProductModelId = PRODUCT_MODEL_ID,
        code: String = "TOP",
        label: String = "Table Top",
        description: String? = "The top surface of the table",
        sortOrder: Int? = 1,
    ) = ComponentCreateParams(
        productModelId = productModelId,
        code = code,
        label = label,
        description = description,
        sortOrder = sortOrder,
    )
}

package cz.vokounova.configurator.products.domain

import java.time.OffsetDateTime
import java.util.UUID

@JvmInline
value class ComponentId(
    val value: UUID,
)

data class Component(
    val id: ComponentId,
    val productModelId: ProductModelId,
    val code: String,
    val label: String,
    val description: String?,
    val sortOrder: Int,
    val createdAt: OffsetDateTime,
    val modifiedAt: OffsetDateTime,
) {
    companion object {
        fun create(params: ComponentCreateParams): Component {
            val timestamp = OffsetDateTime.now()
            return Component(
                id = ComponentId(UUID.randomUUID()),
                productModelId = params.productModelId,
                code = params.code,
                label = params.label,
                description = params.description,
                sortOrder = params.sortOrder ?: 0,
                createdAt = timestamp,
                modifiedAt = timestamp,
            )
        }
    }
}

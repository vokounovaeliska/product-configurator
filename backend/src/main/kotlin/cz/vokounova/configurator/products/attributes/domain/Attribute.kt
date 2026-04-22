package cz.vokounova.configurator.products.attributes.domain

import cz.vokounova.configurator.generated.jooq.enums.AttributeType
import cz.vokounova.configurator.products.components.domain.ComponentId
import java.math.BigDecimal
import java.time.OffsetDateTime
import java.util.UUID

@JvmInline
value class AttributeId(
    val value: UUID,
)

data class Attribute(
    val id: AttributeId,
    val componentId: ComponentId,
    val code: String,
    val label: String,
    val type: AttributeType,
    val isRequired: Boolean,
    val minInt: Int?,
    val maxInt: Int?,
    val minDecimal: BigDecimal?,
    val maxDecimal: BigDecimal?,
    
    val defaultInt: Int?,
    
    val defaultDecimal: BigDecimal?,
    
    val unit: String?,
    val sortOrder: Int,
    val createdAt: OffsetDateTime,
    val modifiedAt: OffsetDateTime,
) {
    companion object {
        fun create(params: AttributeCreateParams): Attribute {
            val timestamp = OffsetDateTime.now()
            return Attribute(
                id = AttributeId(UUID.randomUUID()),
                componentId = params.componentId,
                code = params.code,
                label = params.label,
                type = params.type,
                isRequired = params.isRequired ?: true,
                minInt = params.minInt,
                maxInt = params.maxInt,
                minDecimal = params.minDecimal,
                maxDecimal = params.maxDecimal,
                defaultInt = params.defaultInt,
                defaultDecimal = params.defaultDecimal,
                unit = params.unit,
                sortOrder = params.sortOrder ?: 0,
                createdAt = timestamp,
                modifiedAt = timestamp,
            )
        }
    }
}

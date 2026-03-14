package cz.vokounova.configurator.products.api.dto

import cz.vokounova.configurator.generated.jooq.enums.AttributeType
import java.math.BigDecimal
import java.time.OffsetDateTime
import java.util.UUID

data class AttributeExternalDto(
    val id: UUID,
    val componentId: UUID,
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
)

data class AttributeOptionExternalDto(
    val id: UUID,
    val attributeId: UUID,
    val value: String,
    val label: String,
    val imageUrl: String?,
    val sortOrder: Int,
    val createdAt: OffsetDateTime,
    val modifiedAt: OffsetDateTime,
)

data class AttributePricingRuleExternalDto(
    val id: UUID,
    val productModelId: UUID,
    val componentId: UUID?,
    val attributeCode: String,
    val operator: String,
    val value: String,
    val toValue: String?,
    val price: Int,
    val createdAt: OffsetDateTime,
    val modifiedAt: OffsetDateTime,
)

data class ConfiguratorPreferencesExternalDto(
    val zoomDistanceDefault: Double?,
    val zoomDistanceEmbed: Double?,
    val embedShowProductName: Boolean?,
    val embedShowDescription: Boolean?,
    val embedShowComponents: Boolean?,
    val backgroundPreset: String?,
)

data class FullProductConfigDto(
    val product: ProductModelExternalDto,
    val components: List<ComponentExternalDto>,
    val attributesByComponent: Map<String, List<AttributeExternalDto>>,
    val optionsByAttribute: Map<String, List<AttributeOptionExternalDto>>,
    val pricingRules: List<AttributePricingRuleExternalDto>,
    val configuratorPreferences: ConfiguratorPreferencesExternalDto? = null,
)

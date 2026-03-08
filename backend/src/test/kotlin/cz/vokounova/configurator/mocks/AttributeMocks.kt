package cz.vokounova.configurator.mocks

import cz.vokounova.configurator.generated.jooq.enums.AttributeType
import cz.vokounova.configurator.products.attributes.domain.Attribute
import cz.vokounova.configurator.products.attributes.domain.AttributeCreateParams
import cz.vokounova.configurator.products.attributes.domain.AttributeId
import cz.vokounova.configurator.products.attributes.domain.AttributeOption
import cz.vokounova.configurator.products.attributes.domain.AttributeOptionCreateParams
import cz.vokounova.configurator.products.attributes.domain.AttributeOptionId
import cz.vokounova.configurator.products.components.domain.ComponentId
import java.math.BigDecimal
import java.time.OffsetDateTime
import java.util.UUID

object AttributeMocks {
    private val COMPONENT_ID = ComponentId(UUID.fromString("11111111-1111-1111-1111-111111111111"))
    private val ATTRIBUTE_ID = AttributeId(UUID.fromString("22222222-2222-2222-2222-222222222222"))

    fun getAttribute(
        id: AttributeId = AttributeId(UUID.randomUUID()),
        componentId: ComponentId = COMPONENT_ID,
        code: String = "WIDTH",
        label: String = "Width",
        type: AttributeType = AttributeType.INTEGER,
        isRequired: Boolean = true,
        minInt: Int? = 800,
        maxInt: Int? = 2000,
        minDecimal: BigDecimal? = null,
        maxDecimal: BigDecimal? = null,
        defaultInt: Int? = null,
        defaultDecimal: BigDecimal? = null,
        unit: String? = null,
        sortOrder: Int = 1,
        createdAt: OffsetDateTime = OffsetDateTime.now(),
        modifiedAt: OffsetDateTime = OffsetDateTime.now(),
    ) = Attribute(
        id = id,
        componentId = componentId,
        code = code,
        label = label,
        type = type,
        isRequired = isRequired,
        minInt = minInt,
        maxInt = maxInt,
        minDecimal = minDecimal,
        maxDecimal = maxDecimal,
        defaultInt = defaultInt,
        defaultDecimal = defaultDecimal,
        unit = unit,
        sortOrder = sortOrder,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
    )

    fun getAttributeCreateParams(
        componentId: ComponentId = COMPONENT_ID,
        code: String = "WIDTH",
        label: String = "Width",
        type: AttributeType = AttributeType.INTEGER,
        isRequired: Boolean? = null,
        minInt: Int? = 800,
        maxInt: Int? = 2000,
        minDecimal: BigDecimal? = null,
        maxDecimal: BigDecimal? = null,
        defaultInt: Int? = null,
        defaultDecimal: BigDecimal? = null,
        unit: String? = null,
        sortOrder: Int? = 1,
    ) = AttributeCreateParams(
        componentId = componentId,
        code = code,
        label = label,
        type = type,
        isRequired = isRequired,
        minInt = minInt,
        maxInt = maxInt,
        minDecimal = minDecimal,
        maxDecimal = maxDecimal,
        defaultInt = defaultInt,
        defaultDecimal = defaultDecimal,
        unit = unit,
        sortOrder = sortOrder,
    )

    fun getAttributeOption(
        id: AttributeOptionId = AttributeOptionId(UUID.randomUUID()),
        attributeId: AttributeId = ATTRIBUTE_ID,
        value: String = "SMALL",
        label: String = "Small",
        imageUrl: String? = null,
        sortOrder: Int = 1,
        createdAt: OffsetDateTime = OffsetDateTime.now(),
        modifiedAt: OffsetDateTime = OffsetDateTime.now(),
    ) = AttributeOption(
        id = id,
        attributeId = attributeId,
        value = value,
        label = label,
        imageUrl = imageUrl,
        sortOrder = sortOrder,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
    )

    fun getAttributeOptionCreateParams(
        attributeId: AttributeId = ATTRIBUTE_ID,
        value: String = "SMALL",
        label: String = "Small",
        imageUrl: String? = null,
        sortOrder: Int? = 1,
    ) = AttributeOptionCreateParams(
        attributeId = attributeId,
        value = value,
        label = label,
        imageUrl = imageUrl,
        sortOrder = sortOrder,
    )
}

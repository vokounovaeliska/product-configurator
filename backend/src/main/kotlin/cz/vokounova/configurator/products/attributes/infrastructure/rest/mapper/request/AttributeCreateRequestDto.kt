package cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request

import cz.vokounova.configurator.generated.jooq.enums.AttributeType
import java.math.BigDecimal

data class AttributeCreateRequestDto(
    val code: String,
    val label: String,
    val type: AttributeType,
    val isRequired: Boolean? = null,
    val minInt: Int? = null,
    val maxInt: Int? = null,
    val minDecimal: BigDecimal? = null,
    val maxDecimal: BigDecimal? = null,
    val sortOrder: Int? = null,
)

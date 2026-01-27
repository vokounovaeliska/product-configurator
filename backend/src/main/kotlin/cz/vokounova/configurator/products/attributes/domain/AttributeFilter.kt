package cz.vokounova.configurator.products.attributes.domain

import cz.vokounova.configurator.generated.jooq.enums.AttributeType
import cz.vokounova.configurator.products.components.domain.ComponentId

data class AttributeFilter(
    val componentIds: List<ComponentId>? = null,
    val ids: List<AttributeId>? = null,
    val types: List<AttributeType>? = null,
)

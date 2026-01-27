package cz.vokounova.configurator.products.attributes.infrastructure.rest.request

import cz.vokounova.configurator.generated.jooq.enums.AttributeType
import java.util.UUID

data class AttributeListQueryParams(
    val componentIds: List<UUID>? = null,
    val ids: List<UUID>? = null,
    val types: List<AttributeType>? = null,
    val limit: Int? = null,
    val orderBy: List<String>? = null,
)

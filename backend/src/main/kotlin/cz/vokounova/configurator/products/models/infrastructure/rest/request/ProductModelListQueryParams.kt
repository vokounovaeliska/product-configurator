package cz.vokounova.configurator.products.models.infrastructure.rest.request

import java.util.UUID

data class ProductModelListQueryParams(
    val limit: Int? = null,
    val orderBy: List<String>? = null,
    val ids: List<UUID>? = null,
    val userIds: List<UUID>? = null,
    val isActive: Boolean? = null,
)

package cz.vokounova.configurator.products.infrastructure.rest.request

import java.util.UUID

data class ComponentListQueryParams(
    val productModelIds: List<UUID>? = null,
    val ids: List<UUID>? = null,
    val limit: Int? = null,
    val orderBy: List<String>? = null,
)

package cz.vokounova.configurator.users.infrastructure.rest.request

import java.util.UUID

data class UserListQueryParams(
    val limit: Int? = null,
    val orderBy: List<String>? = null,
    val ids: List<UUID>? = null,
)

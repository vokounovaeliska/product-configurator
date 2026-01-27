package cz.vokounova.configurator.users.domain

data class UserFilter(
    val ids: List<UserId>? = null,
    val search: String? = null,
)

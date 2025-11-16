package cz.vokounova.configurator.users.infrastructure.rest.mapper.request

data class LoginCredentialsDto(
    val email: String,
    val password: String,
)

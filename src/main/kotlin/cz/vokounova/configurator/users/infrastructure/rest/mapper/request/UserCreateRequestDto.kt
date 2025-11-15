package cz.vokounova.configurator.users.infrastructure.rest.mapper.request

data class UserCreateRequestDto(
    val firstName: String,
    val surname: String,
    val email: String,
    val name: String,
    val password: String,
    val confirmPassword: String,
)

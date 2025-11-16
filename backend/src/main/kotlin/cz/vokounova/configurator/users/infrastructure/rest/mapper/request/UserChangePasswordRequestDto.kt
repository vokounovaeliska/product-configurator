package cz.vokounova.configurator.users.infrastructure.rest.mapper.request

data class UserChangePasswordRequestDto(
    val newPassword: String,
    val confirmNewPassword: String,
)

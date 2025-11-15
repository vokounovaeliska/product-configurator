package cz.vokounova.configurator.users.infrastructure.rest.mapper.request

data class UserMeChangePasswordRequestDto(
    val oldPassword: String,
    val newPassword: String,
    val confirmNewPassword: String,
)

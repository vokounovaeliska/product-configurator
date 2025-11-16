package cz.vokounova.configurator.users.domain

data class UserAuthentication(
    val accessToken: String,
    val refreshToken: String,
)

data class UserAuthenticationRequestLoginPassword(
    val email: String,
    val password: String,
)

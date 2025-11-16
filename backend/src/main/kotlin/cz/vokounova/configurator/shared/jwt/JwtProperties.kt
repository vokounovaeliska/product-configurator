package cz.vokounova.configurator.shared.jwt

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "jwt")
data class JwtProperties(
    val users: JwtConfig,
) {
    data class JwtConfig(
        val key: String,
        val accessTokenExpirationInMinutes: Long,
        val refreshTokenExpirationInMinutes: Long,
    )
}

package cz.vokounova.configurator.shared.jwt

import java.time.OffsetDateTime
import java.util.UUID
import java.util.function.Supplier

interface JwtService<T> {
    fun generateAccessToken(
        auth: T,
        startDateSupplier: Supplier<OffsetDateTime> = Supplier { OffsetDateTime.now() },
    ): JwtToken

    fun generateRefreshToken(
        auth: T,
        startDateSupplier: Supplier<OffsetDateTime> = Supplier { OffsetDateTime.now() },
    ): JwtToken

    fun getAuth(token: String): T

    fun getJwtId(token: String): JwtTokenId

    fun isValid(
        token: String,
        auth: T,
    ): Boolean

    fun isExpired(token: String): Boolean
}

@JvmInline
value class JwtTokenId(
    val value: UUID,
)

data class JwtToken(
    val token: String,
    val id: JwtTokenId,
    val expiresAt: OffsetDateTime,
)

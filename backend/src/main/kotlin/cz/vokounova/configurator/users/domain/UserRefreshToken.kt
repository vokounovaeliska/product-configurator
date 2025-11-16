package cz.vokounova.configurator.users.domain

import cz.vokounova.configurator.shared.jwt.JwtTokenId
import java.time.OffsetDateTime

data class UserRefreshToken(
    val jwtId: JwtTokenId,
    val userId: UserId,
    val createdAt: OffsetDateTime,
    val expiresAt: OffsetDateTime,
)

package cz.vokounova.configurator.users.ports.outbound

import cz.vokounova.configurator.shared.jwt.JwtTokenId
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.domain.UserRefreshToken
import java.time.OffsetDateTime

interface UserRefreshTokenRepository {
    fun findTokenByUserId(userId: UserId): UserRefreshToken

    fun findTokenByJwtId(jwtId: JwtTokenId): UserRefreshToken

    fun createToken(userRefreshToken: UserRefreshToken)

    fun deleteTokenByUserId(userId: UserId)

    fun deleteTokenByJwtTokenId(jwtTokenId: JwtTokenId)

    fun deleteExpiredTokens(currentTime: OffsetDateTime)

    fun getTokens(): List<UserRefreshToken>
}

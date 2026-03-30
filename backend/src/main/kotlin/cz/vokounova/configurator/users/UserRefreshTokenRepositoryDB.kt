package cz.vokounova.configurator.users

import cz.vokounova.configurator.generated.jooq.tables.references.USER_REFRESH_TOKEN
import cz.vokounova.configurator.shared.exceptions.ResourceNotFoundException
import cz.vokounova.configurator.shared.jwt.JwtTokenId
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.domain.UserRefreshToken
import cz.vokounova.configurator.users.infrastructure.persistence.mapper.toDomain
import cz.vokounova.configurator.users.infrastructure.persistence.mapper.toPersistence
import cz.vokounova.configurator.users.ports.outbound.UserRefreshTokenRepository
import org.jooq.DSLContext
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime

@Component
class UserRefreshTokenRepositoryDB(
    private val dslContext: DSLContext,
) : UserRefreshTokenRepository {
    override fun findTokenByUserId(userId: UserId): UserRefreshToken =
        dslContext
            .selectFrom(USER_REFRESH_TOKEN)
            .where(USER_REFRESH_TOKEN.USER_ID.eq(userId.value))
            .fetchOne()
            ?.toDomain()
            ?: throw ResourceNotFoundException("Refresh token for userId: ${userId.value} not found")

    override fun findTokenByJwtId(jwtId: JwtTokenId): UserRefreshToken =
        dslContext
            .selectFrom(USER_REFRESH_TOKEN)
            .where(USER_REFRESH_TOKEN.JWT_ID.eq(jwtId.value))
            .fetchOne()
            ?.toDomain()
            ?: throw ResourceNotFoundException("Refresh token for jwtId: ${jwtId.value} not found")

    @Transactional
    override fun createToken(userRefreshToken: UserRefreshToken) {
        val record = userRefreshToken.toPersistence()
        dslContext
            .insertInto(USER_REFRESH_TOKEN)
            .set(record)
            .execute()
    }

    override fun deleteTokenByUserId(userId: UserId) {
        dslContext
            .deleteFrom(USER_REFRESH_TOKEN)
            .where(USER_REFRESH_TOKEN.USER_ID.eq(userId.value))
            .execute()
    }

    override fun deleteTokenByJwtTokenId(jwtTokenId: JwtTokenId) {
        dslContext
            .deleteFrom(USER_REFRESH_TOKEN)
            .where(USER_REFRESH_TOKEN.JWT_ID.eq(jwtTokenId.value))
            .execute()
    }

    override fun deleteExpiredTokens(currentTime: OffsetDateTime) {
        dslContext
            .deleteFrom(USER_REFRESH_TOKEN)
            .where(USER_REFRESH_TOKEN.EXPIRES_AT.lessOrEqual(currentTime))
            .execute()
    }

    override fun getTokens(): List<UserRefreshToken> = dslContext.selectFrom(USER_REFRESH_TOKEN).fetch().map { it.toDomain() }
}

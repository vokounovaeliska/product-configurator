package cz.vokounova.configurator.users.infrastructure.persistence.mapper

import cz.vokounova.configurator.generated.jooq.tables.records.UserRefreshTokenRecord
import cz.vokounova.configurator.shared.jwt.JwtTokenId
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.domain.UserRefreshToken

fun UserRefreshToken.toPersistence() =
    UserRefreshTokenRecord(
        jwtId.value,
        userId.value,
        createdAt,
        expiresAt,
    )

fun UserRefreshTokenRecord.toDomain() =
    UserRefreshToken(
        JwtTokenId(jwtId),
        UserId(userId),
        createdAt,
        expiresAt,
    )

package cz.vokounova.configurator.mocks

import cz.vokounova.configurator.shared.jwt.JwtProperties
import cz.vokounova.configurator.shared.jwt.JwtTokenId
import cz.vokounova.configurator.shared.security.AuthDetails
import cz.vokounova.configurator.shared.security.AuthId
import cz.vokounova.configurator.users.domain.User
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.domain.UserRefreshToken
import java.time.OffsetDateTime
import java.util.UUID

object UserMocks {
    private val USER_ID = UserId(UUID.fromString("a1b16dcb-b885-4783-b085-358a97e7e71e"))
    private val JWT_TOKEN_ID = JwtTokenId(UUID.fromString("3b736a1d-33f9-4eee-aa98-658b1134a9e0"))

    fun getUser(
        id: UserId = UserId(UUID.randomUUID()),
        firstName: String = "John",
        surname: String = "Surname",
        email: String = "johndoe@email.com",
        password: String = "Password123",
        modifiedAt: OffsetDateTime = OffsetDateTime.now(),
    ) = User(
        id = id,
        firstName = firstName,
        surname = surname,
        email = email,
        password = password,
        createdAt = OffsetDateTime.now(),
        modifiedAt = modifiedAt,
        checkSum = "checksum-123",
    )

    fun getJwtProperties(): JwtProperties =
        JwtProperties(
            users =
                JwtProperties.JwtConfig(
                    key = "eYO3lM2ZbmOICY3rPDIqsTRVNBOf5PtI",
                    accessTokenExpirationInMinutes = 1,
                    refreshTokenExpirationInMinutes = 1,
                ),
        )

    fun getAuthDetails(
        userId: UserId = USER_ID,
        isActive: Boolean = true,
    ): AuthDetails =
        AuthDetails(
            authId = AuthId(userId.value),
            email = "johndoe@email.com",
            password = "password",
            authorities = mutableListOf(),
            fullName = "John Doe",
        )

    fun getUserRefreshToken(
        userId: UserId = USER_ID,
        jwtId: JwtTokenId = JWT_TOKEN_ID,
    ): UserRefreshToken =
        UserRefreshToken(
            jwtId = jwtId,
            userId = userId,
            createdAt = OffsetDateTime.now(),
            expiresAt = OffsetDateTime.now().plusDays(1),
        )
}

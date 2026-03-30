package cz.vokounova.configurator.unit.users

import cz.vokounova.configurator.mocks.UserMocks
import cz.vokounova.configurator.shared.exceptions.ApplicationException
import cz.vokounova.configurator.shared.exceptions.AuthErrorCode
import cz.vokounova.configurator.shared.exceptions.AuthException
import cz.vokounova.configurator.shared.exceptions.ResourceNotFoundException
import cz.vokounova.configurator.shared.jwt.JwtToken
import cz.vokounova.configurator.shared.jwt.JwtTokenId
import cz.vokounova.configurator.users.application.configuration.UserDetailsService
import cz.vokounova.configurator.users.application.configuration.UserJwtService
import cz.vokounova.configurator.users.application.usecase.UserGetRefreshTokenUseCase
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.ports.outbound.UserRefreshTokenRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.withSettings
import org.mockito.kotlin.whenever
import java.time.OffsetDateTime
import java.util.UUID

class UserGetRefreshTokenUseCaseTest {
    private val userDetailsServiceMock = mock<UserDetailsService>()
    private val jwtServiceMock =
        mock<UserJwtService>(
            withSettings().useConstructor(UserMocks.getJwtProperties()),
        )
    private val refreshTokenRepositoryMock = mock<UserRefreshTokenRepository>()

    private val userGetRefreshTokenUseCase =
        UserGetRefreshTokenUseCase(
            userDetailsServiceMock,
            jwtServiceMock,
            refreshTokenRepositoryMock,
        )

    private val refreshToken = "refresh-token"
    private val accessToken = "access-token"
    private val jwtId = JwtTokenId(UUID.fromString("18fb529a-cb47-4786-90c4-af9f88a2247a"))
    private val userDetails = UserMocks.getAuthDetails()

    @Test
    fun `It throws error with code EXPIRED_REFRESH_TOKEN when refresh token is expired`() {
        whenever(jwtServiceMock.isExpired(refreshToken)).thenReturn(true)

        val exception: ApplicationException =
            assertThrows(AuthException::class.java) {
                userGetRefreshTokenUseCase.run(refreshToken)
            }

        assertEquals(AuthErrorCode.EXPIRED_REFRESH_TOKEN.name, exception.code)
    }

    @Test
    fun `It throws error with code INVALID_REFRESH_TOKEN if token does not exist for userId and jwtId`() {
        whenever(jwtServiceMock.isExpired(refreshToken)).thenReturn(false)
        whenever(jwtServiceMock.getAuth(refreshToken)).thenReturn(UserId.from(userDetails.id()))

        whenever(userDetailsServiceMock.loadUserById(UserId.from(userDetails.id()))).thenReturn(userDetails)
        whenever(jwtServiceMock.getJwtId(refreshToken)).thenReturn(jwtId)

        whenever(
            refreshTokenRepositoryMock.findTokenByJwtId(jwtId),
        ).thenThrow(ResourceNotFoundException("Not exist"))

        val exception: AuthException =
            assertThrows(AuthException::class.java) {
                userGetRefreshTokenUseCase.run(refreshToken)
            }

        assertEquals(AuthErrorCode.INVALID_REFRESH_TOKEN.name, exception.code)
    }

    @Test
    fun `It throws error with code INVALID_REFRESH_TOKEN if user does not exist for userId`() {
        whenever(jwtServiceMock.isExpired(refreshToken)).thenReturn(false)
        whenever(jwtServiceMock.getAuth(refreshToken)).thenReturn(UserId.from(userDetails.id()))

        whenever(userDetailsServiceMock.loadUserById(UserId.from(userDetails.id()))).thenThrow(ResourceNotFoundException("Not exist"))

        val exception: AuthException =
            assertThrows(AuthException::class.java) {
                userGetRefreshTokenUseCase.run(refreshToken)
            }

        assertEquals(AuthErrorCode.INVALID_REFRESH_TOKEN.name, exception.code)
    }

    @Test
    fun `It returns access token`() {
        whenever(jwtServiceMock.isExpired(refreshToken)).thenReturn(false)
        whenever(jwtServiceMock.getAuth(refreshToken)).thenReturn(UserId.from(userDetails.id()))

        whenever(userDetailsServiceMock.loadUserById(UserId.from(userDetails.id()))).thenReturn(userDetails)
        whenever(jwtServiceMock.getJwtId(refreshToken)).thenReturn(jwtId)

        whenever(refreshTokenRepositoryMock.findTokenByJwtId(jwtId)).thenReturn(
            UserMocks.getUserRefreshToken(),
        )

        whenever(jwtServiceMock.generateAccessToken(UserId.from(userDetails.id()))).thenReturn(
            JwtToken(
                accessToken,
                JwtTokenId(UUID.randomUUID()),
                OffsetDateTime.now(),
            ),
        )

        assertNotNull(userGetRefreshTokenUseCase.run(refreshToken))
        assertEquals(accessToken, userGetRefreshTokenUseCase.run(refreshToken).token)
    }
}

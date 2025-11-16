package cz.vokounova.configurator.unit.users

import cz.vokounova.configurator.mocks.UserMocks
import cz.vokounova.configurator.shared.exceptions.CommonErrorCode
import cz.vokounova.configurator.shared.exceptions.ResourceNotFoundException
import cz.vokounova.configurator.shared.jwt.JwtToken
import cz.vokounova.configurator.shared.jwt.JwtTokenId
import cz.vokounova.configurator.users.application.configuration.UserDetailsService
import cz.vokounova.configurator.users.application.configuration.UserJwtService
import cz.vokounova.configurator.users.application.usecase.UserLoginWithPasswordUseCase
import cz.vokounova.configurator.users.domain.UserAuthenticationRequestLoginPassword
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.domain.UserRefreshToken
import cz.vokounova.configurator.users.ports.outboud.UserRefreshTokenRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.withSettings
import org.mockito.kotlin.doNothing
import org.mockito.kotlin.whenever
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import java.time.OffsetDateTime
import java.util.UUID

class UserLoginWithPasswordUseCaseTest {
    private val userDetailsServiceMock = mock<UserDetailsService>()
    private val jwtServiceMock =
        mock<UserJwtService>(
            withSettings().useConstructor(UserMocks.getJwtProperties()),
        )

    private val refreshTokenRepositoryMock = mock<UserRefreshTokenRepository>()
    private val authManagerMock = mock<AuthenticationManager>()

    private val userLoginWithPasswordUseCase =
        UserLoginWithPasswordUseCase(
            userDetailsServiceMock,
            jwtServiceMock,
            refreshTokenRepositoryMock,
            authManagerMock,
        )

    private val params = UserAuthenticationRequestLoginPassword("loginName@emial.com", "password")
    private val authenticationMock: Authentication = mock()

    @Test
    fun `It throws error with code RESOURCE_DOES_EXIST when user with user name does not exist`() {
        val usernamePasswordAuthenticationTokenMock = mock<UsernamePasswordAuthenticationToken>()

        whenever(authManagerMock.authenticate(usernamePasswordAuthenticationTokenMock)).thenReturn(authenticationMock)
        whenever(userDetailsServiceMock.loadUserByUsername(params.email)).thenThrow(
            ResourceNotFoundException("Resource not found"),
        )

        val exception: ResourceNotFoundException =
            assertThrows(ResourceNotFoundException::class.java) {
                userLoginWithPasswordUseCase.run(params)
            }

        assertEquals(CommonErrorCode.RESOURCE_NOT_FOUND.name, exception.code)
    }

    @Test
    fun `It returns generated access and refresh tokens`() {
        val usernamePasswordAuthenticationTokenMock = mock<UsernamePasswordAuthenticationToken>()
        val userRefreshTokenMock = mock<UserRefreshToken>()
        val userMock = UserMocks.getAuthDetails()

        whenever(authManagerMock.authenticate(usernamePasswordAuthenticationTokenMock)).thenReturn(authenticationMock)
        whenever(userDetailsServiceMock.loadUserByUsername(params.email)).thenReturn(userMock)

        val accessToken =
            JwtToken(
                "access-token",
                JwtTokenId(UUID.randomUUID()),
                expiresAt = OffsetDateTime.now(),
            )

        val refreshToken =
            JwtToken(
                "refresh-token",
                JwtTokenId(UUID.randomUUID()),
                expiresAt = OffsetDateTime.now(),
            )

        whenever(jwtServiceMock.generateAccessToken(UserId.from(userMock.id()))).thenReturn(accessToken)
        whenever(jwtServiceMock.generateRefreshToken(UserId.from(userMock.id()))).thenReturn(refreshToken)

        doNothing().`when`(refreshTokenRepositoryMock).createToken(userRefreshTokenMock)

        val result = userLoginWithPasswordUseCase.run(params)

        assertEquals(result.refreshToken, "refresh-token")
        assertEquals(result.accessToken, "access-token")
    }
}

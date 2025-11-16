package cz.vokounova.configurator.users.application.usecase

import cz.vokounova.configurator.shared.exceptions.AuthErrorCode
import cz.vokounova.configurator.shared.exceptions.AuthException
import cz.vokounova.configurator.users.application.configuration.UserDetailsService
import cz.vokounova.configurator.users.application.configuration.UserJwtService
import cz.vokounova.configurator.users.domain.UserAuthentication
import cz.vokounova.configurator.users.domain.UserAuthenticationRequestLoginPassword
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.domain.UserRefreshToken
import cz.vokounova.configurator.users.ports.inbound.UserLoginWithPassword
import cz.vokounova.configurator.users.ports.outboud.UserRefreshTokenRepository
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.stereotype.Component
import java.time.OffsetDateTime

@Component
class UserLoginWithPasswordUseCase(
    private val userDetailsService: UserDetailsService,
    private val jwtService: UserJwtService,
    private val refreshTokenRepository: UserRefreshTokenRepository,
    private val authManager: AuthenticationManager,
) : UserLoginWithPassword {
    override fun run(params: UserAuthenticationRequestLoginPassword): UserAuthentication {
        authManager.authenticate(
            UsernamePasswordAuthenticationToken(
                params.email,
                params.password,
            ),
        )

        val user =
            userDetailsService.loadUserByUsername(params.email)
                ?: throw AuthException(AuthErrorCode.INVALID_CREDENTIALS)

        val userId = UserId(user.id().value)
        val accessToken = jwtService.generateAccessToken(userId)
        val refreshToken = jwtService.generateRefreshToken(userId)

        refreshTokenRepository.createToken(
            UserRefreshToken(
                jwtId = refreshToken.id,
                userId = userId,
                createdAt = OffsetDateTime.now(),
                expiresAt = refreshToken.expiresAt,
            ),
        )

        return UserAuthentication(
            accessToken = accessToken.token,
            refreshToken = refreshToken.token,
        )
    }
}

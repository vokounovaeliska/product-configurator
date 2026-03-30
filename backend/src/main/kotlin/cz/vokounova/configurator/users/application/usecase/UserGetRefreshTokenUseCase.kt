package cz.vokounova.configurator.users.application.usecase

import cz.vokounova.configurator.shared.exceptions.AuthErrorCode
import cz.vokounova.configurator.shared.exceptions.AuthException
import cz.vokounova.configurator.shared.exceptions.ResourceNotFoundException
import cz.vokounova.configurator.shared.jwt.JwtToken
import cz.vokounova.configurator.shared.utils.logger
import cz.vokounova.configurator.users.application.configuration.UserDetailsService
import cz.vokounova.configurator.users.application.configuration.UserJwtService
import cz.vokounova.configurator.users.ports.inbound.UserGetRefreshToken
import cz.vokounova.configurator.users.ports.outbound.UserRefreshTokenRepository
import org.springframework.stereotype.Component

@Component
class UserGetRefreshTokenUseCase(
    private val userDetailsService: UserDetailsService,
    private val jwtService: UserJwtService,
    private val refreshTokenRepository: UserRefreshTokenRepository,
) : UserGetRefreshToken {
    companion object {
        private val LOG by logger()
    }

    override fun run(refreshToken: String): JwtToken {
        if (jwtService.isExpired(refreshToken)) {
            throw AuthException(AuthErrorCode.EXPIRED_REFRESH_TOKEN)
        }

        // For user auth is User ID UUID as string
        return jwtService.getAuth(refreshToken).let {
            val jwtId = jwtService.getJwtId(refreshToken)

            try {
                val userDetails =
                    userDetailsService.loadUserById(it)
                        ?: throw ResourceNotFoundException("User with id: ${it.value} not found")

                if (!userDetails.isEnabled) {
                    throw AuthException(AuthErrorCode.DEACTIVATED)
                }

                // If refresh token does not exist, it will raise Not found error
                refreshTokenRepository.findTokenByJwtId(jwtId)

                jwtService.generateAccessToken(it)
            } catch (e: ResourceNotFoundException) {
                LOG.error("Could not find refresh token", e)
                throw AuthException(AuthErrorCode.INVALID_REFRESH_TOKEN)
            }
        }
    }
}

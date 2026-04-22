package cz.vokounova.configurator.users.application.configuration

import cz.vokounova.configurator.shared.utils.logger
import cz.vokounova.configurator.users.infrastructure.rest.UsersAuthController.Companion.REFRESH_TOKEN_COOKIE
import cz.vokounova.configurator.users.ports.outbound.UserRefreshTokenRepository
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.core.Authentication
import org.springframework.security.web.authentication.logout.LogoutHandler
import org.springframework.stereotype.Component

@Component
class UserLogoutHandler(
    private val refreshTokenRepository: UserRefreshTokenRepository,
    private val jwtService: UserJwtService,
) : LogoutHandler {
    companion object {
        private val LOG by logger()
    }

    override fun logout(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authentication: Authentication?,
    ) {
        request.cookies?.find { it.name == REFRESH_TOKEN_COOKIE }?.let {
            try {
                val jwtId = jwtService.getJwtId(it.value)
                refreshTokenRepository.deleteTokenByJwtTokenId(jwtId)

                LOG.debug("Successfully logout user with refresh token {}", jwtId.value)
            } catch (e: Exception) {
                LOG.error(
                    "Unexpected error occurred while processing a delete of refresh token from cookie ${it.value}. Error: ${e.message}",
                    e,
                )
            }
        }
    }
}

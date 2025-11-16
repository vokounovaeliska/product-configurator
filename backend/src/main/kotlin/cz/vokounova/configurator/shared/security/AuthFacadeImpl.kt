package cz.vokounova.configurator.shared.security

import cz.vokounova.configurator.shared.exceptions.AuthErrorCode
import cz.vokounova.configurator.shared.exceptions.AuthException
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component

@Component
class AuthFacadeImpl : AuthFacade {
    override fun getAuthentication(): Authentication =
        SecurityContextHolder.getContext().authentication ?: throw AuthException(AuthErrorCode.UNAUTHORIZED)

    override fun getCurrentAuthDetails(): AuthDetails = getAuthentication().principal as AuthDetails
}

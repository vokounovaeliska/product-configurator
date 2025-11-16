package cz.vokounova.configurator.users.application.configuration

import cz.vokounova.configurator.shared.exceptions.AuthErrorCode
import cz.vokounova.configurator.shared.exceptions.AuthException
import org.springframework.security.authentication.AuthenticationProvider
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.stereotype.Component

@Component("UserLoginPasswordAuthenticationProvider")
class UserLoginPasswordAuthenticationProvider(
    private val userDetailsService: UserDetailsService,
    private val passwordEncoder: UserPasswordEncoder,
) : AuthenticationProvider {
    override fun authenticate(authentication: Authentication): Authentication {
        val username = authentication.name
        val password = authentication.credentials.toString()

        val userDetails =
            userDetailsService.loadUserByUsername(username)
                ?: throw AuthException(AuthErrorCode.INVALID_CREDENTIALS)

        if (!passwordEncoder.matches(password, userDetails.password)) {
            throw AuthException(AuthErrorCode.INVALID_CREDENTIALS)
        }

        if (!userDetails.isEnabled) {
            throw AuthException(AuthErrorCode.DEACTIVATED)
        }

        val authenticated: Authentication =
            UsernamePasswordAuthenticationToken(
                userDetails,
                password,
                userDetails.authorities,
            )
        return authenticated
    }

    override fun supports(authentication: Class<*>): Boolean = authentication == UsernamePasswordAuthenticationToken::class.java
}

package cz.vokounova.configurator.mocks

import cz.vokounova.configurator.mocks.UserMocks.getAuthDetails
import cz.vokounova.configurator.users.domain.UserId
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication
import org.springframework.test.web.servlet.request.RequestPostProcessor

object AuthMocks {
    fun mockUser(
        userId: UserId,
        email: String,
    ): RequestPostProcessor {
        val authDetails = getAuthDetails(userId = userId)
        // All logged-in users are admins
        val authorities = listOf(SimpleGrantedAuthority("ROLE_ADMIN"))
        val auth =
            org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                authDetails.copy(authorities = authorities.toMutableList()),
                null,
                authorities,
            )
        return authentication(auth)
    }

    fun mockAdmin(): RequestPostProcessor =
        mockUser(
            userId = UserId(java.util.UUID.randomUUID()),
            email = "admin@email.com",
        )
}

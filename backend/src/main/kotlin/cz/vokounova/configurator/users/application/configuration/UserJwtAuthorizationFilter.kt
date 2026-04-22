package cz.vokounova.configurator.users.application.configuration

import cz.vokounova.configurator.shared.security.doesNotContainBearerToken
import cz.vokounova.configurator.shared.security.extractBearerTokenValue
import cz.vokounova.configurator.shared.security.getAuthorizationHeader
import cz.vokounova.configurator.shared.utils.logger
import cz.vokounova.configurator.users.domain.UserId
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.security.web.util.matcher.AntPathRequestMatcher
import org.springframework.security.web.util.matcher.OrRequestMatcher
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import kotlin.getValue

@Component
class UserJwtAuthorizationFilter(
    private val userDetailsService: UserDetailsService,
    private val jwtService: UserJwtService,
) : OncePerRequestFilter() {
    companion object {
        private val LOG by logger()
        private val usersPathMatcher = AntPathRequestMatcher("/users/**")
        private val productsPathMatcher = AntPathRequestMatcher("/products/**")

        private val filesUploadPathMatcher = AntPathRequestMatcher("/api/v1/files/upload")
        private val authenticatedPathsMatcher = OrRequestMatcher(usersPathMatcher, productsPathMatcher, filesUploadPathMatcher)
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val authorizationHeader: String? = request.getAuthorizationHeader()

        LOG.debug("Started authentication for device with Authorization header: {}", authorizationHeader)

        if (authorizationHeader.doesNotContainBearerToken()) {
            filterChain.doFilter(request, response)
            return
        }

        val jwtToken = authorizationHeader!!.extractBearerTokenValue()
        val userId = jwtService.getAuth(jwtToken)

        if (SecurityContextHolder.getContext().authentication == null) {
            val foundUser = userDetailsService.loadUserById(userId)
            if (foundUser == null || !foundUser.isEnabled) {
                filterChain.doFilter(request, response)
                return
            }

            if (jwtService.isValid(jwtToken, UserId(foundUser.id().value))) {
                val authToken = UsernamePasswordAuthenticationToken(foundUser, null, foundUser.authorities)
                authToken.details = WebAuthenticationDetailsSource().buildDetails(request)
                SecurityContextHolder.getContext().authentication = authToken
            }

            filterChain.doFilter(request, response)
        }
    }

    override fun shouldNotFilter(request: HttpServletRequest): Boolean = !authenticatedPathsMatcher.matches(request)
}

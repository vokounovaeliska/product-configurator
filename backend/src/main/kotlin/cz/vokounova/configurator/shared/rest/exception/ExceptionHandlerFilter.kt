package cz.vokounova.configurator.shared.rest.exception

import cz.vokounova.configurator.shared.exceptions.AuthException
import cz.vokounova.configurator.shared.utils.logger
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import org.springframework.web.servlet.HandlerExceptionResolver

@Component
class ExceptionHandlerFilter(
    private val exceptionResolver: HandlerExceptionResolver,
) : OncePerRequestFilter() {
    companion object {
        private val LOG by logger()
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        try {
            filterChain.doFilter(request, response)
        } catch (e: RuntimeException) {
            if (e is AuthException) {
                LOG.debug("Unauthenticated request to protected endpoint: {}", request.requestURI)
            } else {
                LOG.error("Unexpected error occurred while running filter", e)
            }
            exceptionResolver.resolveException(request, response, null, e)
        }
    }
}

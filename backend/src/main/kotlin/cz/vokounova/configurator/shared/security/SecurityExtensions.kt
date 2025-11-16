package cz.vokounova.configurator.shared.security

import jakarta.servlet.http.HttpServletRequest
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter

fun HttpSecurity.configureDefaultHeaders() {
    headers {
        it.contentTypeOptions { } // Enables nosniff
        it.frameOptions { fo -> fo.deny() } // Enables X-Frame-Options
        it.httpStrictTransportSecurity { hsts ->
            hsts.requestMatcher { true }
            hsts.maxAgeInSeconds(15724800)
            hsts.includeSubDomains(true)
        }
        it.contentSecurityPolicy { csp ->
            csp.policyDirectives("default-src 'self'; frame-ancestors 'none';")
        }
        it.referrerPolicy { rp ->
            rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
        }
    }
}

fun HttpSecurity.defaultSecurityConfig(corsConfig: CorsConfig) {
    configureDefaultHeaders()
    csrf { it.disable() }
    cors { it.configurationSource(corsConfig.corsConfigurationSource()) }
    anonymous { it.disable() }
    sessionManagement { it.disable() }
    formLogin { it.disable() }
}

fun HttpServletRequest.getAuthorizationHeader(): String? = this.getHeader(SecurityHeaders.AUTHORIZATION_HEADER)

fun String?.doesNotContainBearerToken() = this == null || !this.startsWith("Bearer")

fun String.extractBearerTokenValue() = this.substringAfter("Bearer ")

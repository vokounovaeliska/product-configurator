package cz.vokounova.configurator.users.application.configuration

import cz.vokounova.configurator.shared.exceptions.AuthErrorCode
import cz.vokounova.configurator.shared.exceptions.AuthException
import cz.vokounova.configurator.shared.rest.exception.ExceptionHandlerFilter
import cz.vokounova.configurator.shared.security.CorsConfig
import cz.vokounova.configurator.shared.security.phasisDefaultConfig
import cz.vokounova.configurator.users.infrastructure.rest.UsersAuthController.Companion.REFRESH_TOKEN_COOKIE
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.annotation.Order
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler
import org.springframework.security.web.util.matcher.AntPathRequestMatcher

@Configuration
@EnableWebSecurity
class UserSecurityConfiguration {
    companion object {
        val usersPathMatcher = AntPathRequestMatcher("/users/**")
    }

    @Bean
    @Order(1)
    fun usersFilterChain(
        http: HttpSecurity,
        corsConfig: CorsConfig,
        jwtUserAuthorizationFilter: PhasisUserJwtAuthorizationFilter,
        exceptionHandlerFilter: ExceptionHandlerFilter,
        authenticationManager: AuthenticationManager,
        usersAuthenticationProvider: PhasisUserLoginPasswordAuthenticationProvider,
        logoutHandler: PhasisUserLogoutHandler,
    ): SecurityFilterChain {
        http.securityMatcher(usersPathMatcher)
        http.phasisDefaultConfig(corsConfig)
        http.authorizeHttpRequests {
            it.requestMatchers("/users/api/v1/auth/public/**").permitAll()
            it.anyRequest().authenticated()
        }
        http.logout {
            it.addLogoutHandler(logoutHandler)
            it.logoutSuccessHandler(HttpStatusReturningLogoutSuccessHandler())
            // LogoutFilter appears before the AuthorizationFilter in the filter chain.
            it.logoutUrl("/users/api/v1/auth/logout")
            it.deleteCookies(REFRESH_TOKEN_COOKIE)
            it.clearAuthentication(true)
        }
        http.exceptionHandling {
            it.authenticationEntryPoint(unauthorizedUserEntryPoint())
        }
        http.authenticationManager(authenticationManager)
        http.authenticationProvider(usersAuthenticationProvider)
        http
            .addFilterBefore(exceptionHandlerFilter, UsernamePasswordAuthenticationFilter::class.java)
            .addFilterBefore(jwtUserAuthorizationFilter, UsernamePasswordAuthenticationFilter::class.java)
        return http.build()
    }

    /**
     * Returns correct response code for unauthorized users as json
     */
    @Bean
    fun unauthorizedUserEntryPoint(): AuthenticationEntryPoint =
        // HttpServletRequest, HttpServletResponse, AuthenticationException
        AuthenticationEntryPoint { _, _, _ ->
            throw AuthException(AuthErrorCode.UNAUTHORIZED)
        }
}

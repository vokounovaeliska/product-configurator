package cz.vokounova.configurator.users.application.configuration

import cz.vokounova.configurator.shared.exceptions.AuthErrorCode
import cz.vokounova.configurator.shared.exceptions.AuthException
import cz.vokounova.configurator.shared.rest.exception.ExceptionHandlerFilter
import cz.vokounova.configurator.shared.security.CorsConfig
import cz.vokounova.configurator.shared.security.defaultSecurityConfig
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.annotation.Order
import org.springframework.http.HttpMethod
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.AuthenticationProvider
import org.springframework.security.authentication.ProviderManager
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
class DefaultSecurityConfiguration {
    @Order(3)
    @Bean
    fun defaultFilterChain(
        http: HttpSecurity,
        corsConfig: CorsConfig,
        jwtUserAuthorizationFilter: UserJwtAuthorizationFilter,
        exceptionHandlerFilter: ExceptionHandlerFilter,
        authenticationManager: AuthenticationManager,
    ): SecurityFilterChain {
        http.securityMatcher("/**")
        http.defaultSecurityConfig(corsConfig)
        http.authorizeHttpRequests {
            it.requestMatchers("/swagger/**", "/actuator/**").permitAll()
            it.requestMatchers(HttpMethod.GET, "/api/v1/files/**").permitAll()
            it.requestMatchers(HttpMethod.GET, "/embed/api/v1/products/**").permitAll()
            it.requestMatchers(HttpMethod.POST, "/embed/api/v1/customer-requests").permitAll()
            it.requestMatchers(HttpMethod.POST, "/embed/api/v1/configurator-analytics/events").permitAll()
            it.anyRequest().authenticated()
        }
        http.authenticationManager(authenticationManager)
        http.exceptionHandling {
            it.authenticationEntryPoint(defaultAuthenticationEntryPoint())
        }
        http
            .addFilterBefore(exceptionHandlerFilter, UsernamePasswordAuthenticationFilter::class.java)
            .addFilterBefore(jwtUserAuthorizationFilter, UsernamePasswordAuthenticationFilter::class.java)

        return http.build()
    }

    @Bean
    fun authenticationManager(authProviders: List<AuthenticationProvider>): AuthenticationManager = ProviderManager(authProviders)

    @Bean
    fun defaultAuthenticationEntryPoint(): AuthenticationEntryPoint =
        AuthenticationEntryPoint { _, _, _ ->
            throw AuthException(AuthErrorCode.UNAUTHORIZED)
        }
}

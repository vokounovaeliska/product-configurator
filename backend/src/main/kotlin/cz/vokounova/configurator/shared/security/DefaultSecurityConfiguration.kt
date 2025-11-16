package cz.vokounova.configurator.shared.security

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.annotation.Order
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.AuthenticationProvider
import org.springframework.security.authentication.ProviderManager
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.web.SecurityFilterChain

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
class DefaultSecurityConfiguration {
    @Order(3)
    @Bean
    fun defaultFilterChain(
        http: HttpSecurity,
        corsConfig: CorsConfig,
    ): SecurityFilterChain {
        http.securityMatcher("/**")
        http.defaultSecurityConfig(corsConfig)
        http.authorizeHttpRequests {
            it.requestMatchers("/swagger/**", "/actuator/**").permitAll()
            it.anyRequest().authenticated()
        }

        return http.build()
    }

    @Bean
    fun authenticationManager(authProviders: List<AuthenticationProvider>): AuthenticationManager = ProviderManager(authProviders)
}

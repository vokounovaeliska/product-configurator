package cz.vokounova.configurator.configuration

import cz.vokounova.configurator.users.application.configuration.UserPasswordEncoder
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean

@TestConfiguration
class TestConfiguration {
    @Bean("UserPasswordEncoder")
    fun testPasswordEncoder(): UserPasswordEncoder = UserPasswordEncoder(4)
}

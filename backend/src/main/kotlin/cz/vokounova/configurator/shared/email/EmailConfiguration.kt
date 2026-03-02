package cz.vokounova.configurator.shared.email

import cz.vokounova.configurator.shared.email.infrastructure.MailConfig
import cz.vokounova.configurator.shared.email.infrastructure.NoopEmailService
import cz.vokounova.configurator.shared.email.ports.outbound.EmailService
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
@EnableConfigurationProperties(MailConfig::class)
class EmailConfiguration {
    @Bean
    @ConditionalOnMissingBean(EmailService::class)
    fun emailService(): EmailService = NoopEmailService()
}

package cz.vokounova.configurator.shared.email.infrastructure

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app.mail")
data class MailConfig(
    var fromAddress: String = "noreply@configurator.local",
    var fromName: String = "Product Configurator",
    var signatureEnabled: Boolean = true,
)

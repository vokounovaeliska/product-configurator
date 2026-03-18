package cz.vokounova.configurator.shared.email.infrastructure

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app.mail")
data class MailConfig(
    var fromAddress: String = "noreply@configurator.local",
    var fromName: String = "Product Configurator",
    /** When true, appends "Created using konfiguruj.com" signature with logo to all outgoing emails. */
    var signatureEnabled: Boolean = true,
)

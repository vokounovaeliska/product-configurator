package cz.vokounova.configurator.shared.email.ports.outbound

/**
 * Port for sending emails. Implementations may use SMTP or a noop (log-only) when mail is not configured.
 */
interface EmailService {
    /**
     * Send an email. Implementations should not throw – log errors instead so that
     * the primary operation (e.g. creating a customer request) is not affected.
     */
    fun send(
        to: String,
        subject: String,
        bodyHtml: String,
        bodyText: String?,
        replyTo: String? = null,
    )
}

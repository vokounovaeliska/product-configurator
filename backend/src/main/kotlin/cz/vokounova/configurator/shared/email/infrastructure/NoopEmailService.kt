package cz.vokounova.configurator.shared.email.infrastructure

import cz.vokounova.configurator.shared.email.ports.outbound.EmailService
import cz.vokounova.configurator.shared.email.ports.outbound.InlineImage
import org.slf4j.LoggerFactory

/**
 * No-op implementation that logs emails instead of sending. Used when SMTP is not configured.
 * Provided as fallback bean in EmailConfiguration. When spring.mail.host is set,
 * SmtpEmailService takes precedence via @Primary.
 */
class NoopEmailService : EmailService {
    private val log = LoggerFactory.getLogger(javaClass)

    override fun send(
        to: String,
        subject: String,
        bodyHtml: String,
        bodyText: String?,
        replyTo: String?,
        cc: String?,
        inlineImage: InlineImage?,
    ) {
        log.info(
            "Email (noop): to={}, subject={}, replyTo={}, cc={}, bodyLength={}. Configure spring.mail to send real emails.",
            to,
            subject,
            replyTo,
            cc,
            bodyHtml.length,
        )
    }
}

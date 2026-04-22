package cz.vokounova.configurator.shared.email.infrastructure

import cz.vokounova.configurator.shared.email.ports.outbound.EmailService
import cz.vokounova.configurator.shared.email.ports.outbound.InlineImage
import org.slf4j.LoggerFactory


class NoopEmailService : EmailService {
    private val log = LoggerFactory.getLogger(javaClass)

    override fun send(
        to: String,
        subject: String,
        bodyHtml: String,
        bodyText: String?,
        replyTo: String?,
        cc: String?,
        inlineImages: List<InlineImage>?,
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

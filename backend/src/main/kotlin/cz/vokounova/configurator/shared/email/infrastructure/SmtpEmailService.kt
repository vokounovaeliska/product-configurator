package cz.vokounova.configurator.shared.email.infrastructure

import cz.vokounova.configurator.shared.email.ports.outbound.EmailService
import jakarta.mail.internet.InternetAddress
import jakarta.mail.internet.MimeMessage
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.context.annotation.Primary
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.MimeMessageHelper
import org.springframework.stereotype.Service

/**
 * SMTP implementation that sends real emails. Active when spring.mail.host is set and non-empty.
 */
@Service
@Primary
@ConditionalOnExpression("!T(org.springframework.util.StringUtils).isEmpty(@environment.getProperty('spring.mail.host'))")
class SmtpEmailService(
    private val mailSender: JavaMailSender,
    private val mailConfig: MailConfig,
) : EmailService {
    private val log = LoggerFactory.getLogger(javaClass)

    override fun send(
        to: String,
        subject: String,
        bodyHtml: String,
        bodyText: String?,
        replyTo: String?,
    ) {
        try {
            val message: MimeMessage = mailSender.createMimeMessage()
            val helper = MimeMessageHelper(message, true, "UTF-8")
            helper.setFrom(InternetAddress(mailConfig.fromAddress, mailConfig.fromName, "UTF-8"))
            helper.setTo(to)
            replyTo?.let { helper.setReplyTo(it) }
            helper.setSubject(subject)
            helper.setText(bodyText ?: bodyHtml.replace(Regex("<[^>]+>"), ""), bodyHtml)
            mailSender.send(message)
            log.debug("Email sent to {}: {}", to, subject)
        } catch (e: Exception) {
            log.warn("Failed to send email to {}: {}", to, e.message)
        }
    }
}

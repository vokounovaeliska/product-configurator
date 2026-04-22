package cz.vokounova.configurator.shared.email.infrastructure

import cz.vokounova.configurator.shared.email.ports.outbound.EmailService
import cz.vokounova.configurator.shared.email.ports.outbound.InlineImage
import jakarta.annotation.PostConstruct
import jakarta.mail.internet.InternetAddress
import jakarta.mail.internet.MimeMessage
import jakarta.mail.util.ByteArrayDataSource
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.context.annotation.Primary
import org.springframework.core.env.Environment
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.MimeMessageHelper
import org.springframework.stereotype.Service
import java.util.Base64

@Service
@Primary
@ConditionalOnExpression(
    "!T(org.springframework.util.StringUtils).isEmpty(@environment.getProperty('spring.mail.host')) && " +
        "T(org.springframework.util.StringUtils).isEmpty(@environment.getProperty('resend.api-key')) && " +
        "T(org.springframework.util.StringUtils).isEmpty(@environment.getProperty('RESEND_API_KEY'))",
)
class SmtpEmailService(
    private val mailSender: JavaMailSender,
    private val mailConfig: MailConfig,
    private val environment: Environment,
) : EmailService {
    private val log = LoggerFactory.getLogger(javaClass)

    @PostConstruct
    fun logSmtpConfig() {
        log.info(
            "SMTP configured: host={}, port={}, username={}, from={}",
            environment.getProperty("spring.mail.host"),
            environment.getProperty("spring.mail.port"),
            environment.getProperty("spring.mail.username"),
            mailConfig.fromAddress,
        )
    }

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
            "Sending email: to={}, subject={}, from={}, replyTo={}, cc={}, inlineImageCount={}",
            to,
            subject,
            mailConfig.fromAddress,
            replyTo,
            cc,
            inlineImages?.size ?: 0,
        )
        try {
            val message: MimeMessage = mailSender.createMimeMessage()
            val helper = MimeMessageHelper(message, true, "UTF-8")
            helper.setFrom(InternetAddress(mailConfig.fromAddress, mailConfig.fromName, "UTF-8"))
            helper.setTo(to)
            replyTo?.let { helper.setReplyTo(it) }
            cc?.let { helper.setCc(it) }
            helper.setSubject(subject)
            helper.setText(bodyText ?: bodyHtml.replace(Regex("<[^>]+>"), ""), bodyHtml)
            inlineImages?.forEach { img ->
                val base64 =
                    img.base64Data
                        .removePrefix("data:image/png;base64,")
                        .removePrefix("data:image/jpeg;base64,")
                        .removePrefix("data:image/jpg;base64,")
                val bytes = Base64.getDecoder().decode(base64)
                val dataSource = ByteArrayDataSource(bytes, img.mimeType)
                helper.addInline(img.contentId, dataSource)
            }
            mailSender.send(message)
            log.info("Email sent successfully: to={}, subject={}", to, subject)
        } catch (e: Exception) {
            log.error(
                "Failed to send email: to={}, subject={}, error={}, cause={}",
                to,
                subject,
                e.message,
                e.cause?.message,
            )
            if (log.isDebugEnabled) {
                log.debug("Email send failure details", e)
            }
        }
    }
}

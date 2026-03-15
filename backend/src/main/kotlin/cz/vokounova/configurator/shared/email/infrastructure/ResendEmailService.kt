package cz.vokounova.configurator.shared.email.infrastructure

import com.resend.Resend
import com.resend.core.exception.ResendException
import com.resend.services.emails.model.Attachment
import com.resend.services.emails.model.CreateEmailOptions
import cz.vokounova.configurator.shared.email.ports.outbound.EmailService
import cz.vokounova.configurator.shared.email.ports.outbound.InlineImage
import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.context.annotation.Primary
import org.springframework.stereotype.Service
import java.util.Base64

/**
 * Resend API implementation. Uses HTTPS, works on Railway (Free/Hobby) where SMTP is blocked.
 * Active when RESEND_API_KEY is set. Takes precedence over SMTP when both are configured.
 */
@Service
@Primary
@ConditionalOnExpression(
    "!T(org.springframework.util.StringUtils).isEmpty(@environment.getProperty('resend.api-key')) || " +
        "!T(org.springframework.util.StringUtils).isEmpty(@environment.getProperty('RESEND_API_KEY'))",
)
class ResendEmailService(
    @Value("\${resend.api-key}") private val apiKey: String,
    private val mailConfig: MailConfig,
) : EmailService {
    private val log = LoggerFactory.getLogger(javaClass)
    private val resend = Resend(apiKey)

    @PostConstruct
    fun logResendConfig() {
        log.info("Resend configured: from={}", mailConfig.fromAddress)
    }

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
            "Sending email via Resend: to={}, subject={}, from={}, replyTo={}, cc={}, hasInlineImage={}",
            to,
            subject,
            mailConfig.fromAddress,
            replyTo,
            cc,
            inlineImage != null,
        )
        try {
            val fromFormatted = "${mailConfig.fromName} <${mailConfig.fromAddress}>"
            val attachments =
                inlineImage?.let { img ->
                    val base64 =
                        img.base64Data
                            .removePrefix("data:image/png;base64,")
                            .removePrefix("data:image/jpeg;base64,")
                            .removePrefix("data:image/jpg;base64,")
                    val content = Base64.getEncoder().encodeToString(Base64.getDecoder().decode(base64))
                    listOf(
                        Attachment.builder()
                            .fileName("${img.contentId}.png")
                            .content(content)
                            .build(),
                    )
                } ?: emptyList()

            val params =
                CreateEmailOptions.builder()
                    .from(fromFormatted)
                    .to(listOf(to))
                    .subject(subject)
                    .html(bodyHtml)
                    .replyTo(replyTo?.let { listOf(it) } ?: emptyList())
                    .cc(cc?.let { listOf(it) } ?: emptyList())
                    .text(bodyText?.takeIf { it.isNotBlank() })
                    .attachments(attachments.ifEmpty { emptyList() })
                    .build()

            val response = resend.emails().send(params)
            log.info("Email sent successfully via Resend: to={}, subject={}, id={}", to, subject, response?.id)
        } catch (e: ResendException) {
            log.error(
                "Failed to send email via Resend: to={}, subject={}, error={}",
                to,
                subject,
                e.message,
            )
            if (log.isDebugEnabled) {
                log.debug("Resend send failure details", e)
            }
        } catch (e: Exception) {
            log.error(
                "Failed to send email via Resend: to={}, subject={}, error={}, cause={}",
                to,
                subject,
                e.message,
                e.cause?.message,
            )
            if (log.isDebugEnabled) {
                log.debug("Resend send failure details", e)
            }
        }
    }
}

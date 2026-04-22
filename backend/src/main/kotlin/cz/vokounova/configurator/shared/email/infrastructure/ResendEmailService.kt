package cz.vokounova.configurator.shared.email.infrastructure

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.resend.Resend
import com.resend.core.exception.ResendException
import com.resend.services.emails.model.CreateEmailOptions
import cz.vokounova.configurator.shared.email.ports.outbound.EmailService
import cz.vokounova.configurator.shared.email.ports.outbound.InlineImage
import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.context.annotation.Primary
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.client.RestClient
import java.util.Base64


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
    private val restClient =
        RestClient.builder()
            .baseUrl("https://api.resend.com")
            .defaultHeader("Authorization", "Bearer $apiKey")
            .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
            .build()
    private val objectMapper = jacksonObjectMapper()

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
        inlineImages: List<InlineImage>?,
    ) {
        log.info(
            "Sending email via Resend: to={}, subject={}, from={}, replyTo={}, cc={}, inlineImageCount={}",
            to,
            subject,
            mailConfig.fromAddress,
            replyTo,
            cc,
            inlineImages?.size ?: 0,
        )
        try {
            if (!inlineImages.isNullOrEmpty()) {
                sendWithInlineImages(to, subject, bodyHtml, bodyText, replyTo, cc, inlineImages)
            } else {
                sendWithSdk(to, subject, bodyHtml, bodyText, replyTo, cc)
            }
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

    private fun sendWithSdk(
        to: String,
        subject: String,
        bodyHtml: String,
        bodyText: String?,
        replyTo: String?,
        cc: String?,
    ) {
        val fromFormatted = "${mailConfig.fromName} <${mailConfig.fromAddress}>"
        val params =
            CreateEmailOptions.builder()
                .from(fromFormatted)
                .to(listOf(to))
                .subject(subject)
                .html(bodyHtml)
                .replyTo(replyTo?.let { listOf(it) } ?: emptyList())
                .cc(cc?.let { listOf(it) } ?: emptyList())
                .text(bodyText?.takeIf { it.isNotBlank() })
                .build()
        val response = resend.emails().send(params)
        log.info("Email sent successfully via Resend: to={}, subject={}, id={}", to, subject, response?.id)
    }

    private fun sendWithInlineImages(
        to: String,
        subject: String,
        bodyHtml: String,
        bodyText: String?,
        replyTo: String?,
        cc: String?,
        inlineImages: List<InlineImage>,
    ) {
        val fromFormatted = "${mailConfig.fromName} <${mailConfig.fromAddress}>"
        val attachments =
            inlineImages.map { img ->
                val base64 =
                    img.base64Data
                        .removePrefix("data:image/png;base64,")
                        .removePrefix("data:image/jpeg;base64,")
                        .removePrefix("data:image/jpg;base64,")
                val content = Base64.getEncoder().encodeToString(Base64.getDecoder().decode(base64))
                mapOf(
                    "filename" to "${img.contentId}.png",
                    "content" to content,
                    "content_id" to img.contentId,
                )
            }
        val body =
            buildMap<String, Any?> {
                put("from", fromFormatted)
                put("to", listOf(to))
                put("subject", subject)
                put("html", bodyHtml)
                put("reply_to", replyTo?.let { listOf(it) } ?: emptyList<String>())
                put("cc", cc?.let { listOf(it) } ?: emptyList<String>())
                put("text", bodyText?.takeIf { it.isNotBlank() })
                put("attachments", attachments)
            }
        val response =
            restClient
                .post()
                .uri("/emails")
                .body(objectMapper.writeValueAsString(body))
                .retrieve()
                .toEntity(ResendEmailResponse::class.java)
        val id = response.body?.id
        log.info("Email sent successfully via Resend: to={}, subject={}, id={}", to, subject, id)
    }

    private data class ResendEmailResponse(val id: String?)
}

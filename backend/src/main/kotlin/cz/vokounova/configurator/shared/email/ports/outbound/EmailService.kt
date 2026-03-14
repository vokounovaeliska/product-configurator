package cz.vokounova.configurator.shared.email.ports.outbound

/**
 * Inline image to embed in HTML email via CID. Use in img src as cid:contentId.
 * Many email clients block data: URLs; CID attachments display reliably.
 */
data class InlineImage(
    val contentId: String,
    val base64Data: String,
    val mimeType: String = "image/png",
)

/**
 * Port for sending emails. Implementations may use SMTP or a noop (log-only) when mail is not configured.
 */
interface EmailService {
    /**
     * Send an email. Implementations should not throw – log errors instead so that
     * the primary operation (e.g. creating a customer request) is not affected.
     * @param cc Optional CC recipient (e.g. manufacturer copy).
     * @param inlineImage Optional inline image embedded via CID for reliable display in email clients.
     */
    fun send(
        to: String,
        subject: String,
        bodyHtml: String,
        bodyText: String?,
        replyTo: String? = null,
        cc: String? = null,
        inlineImage: InlineImage? = null,
    )
}

package cz.vokounova.configurator.shared.email.ports.outbound

data class InlineImage(
    val contentId: String,
    val base64Data: String,
    val mimeType: String = "image/png",
)

interface EmailService {
    fun send(
        to: String,
        subject: String,
        bodyHtml: String,
        bodyText: String?,
        replyTo: String? = null,
        cc: String? = null,
        inlineImages: List<InlineImage>? = null,
    )
}

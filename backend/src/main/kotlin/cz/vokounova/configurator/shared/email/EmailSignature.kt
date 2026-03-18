package cz.vokounova.configurator.shared.email

import cz.vokounova.configurator.shared.email.ports.outbound.InlineImage
import org.springframework.core.io.ClassPathResource
import java.util.Base64

/** Content-ID for inline logo in email signature. Must match img src="cid:logo" in HTML. */
const val EMAIL_SIGNATURE_LOGO_CID = "logo"

/**
 * Footer signature appended to all outgoing emails.
 * Includes "Created using konfiguruj.com" with a link and embedded logo (CID).
 */
object EmailSignature {
    private const val SITE_URL = "https://konfiguruj.com"
    private const val LINK_TEXT = "konfiguruj.com"

    /**
     * HTML signature with logo (cid:logo) and link. Use when logo is embedded as inline image.
     */
    fun htmlWithLogo(siteUrl: String = SITE_URL): String {
        val url = siteUrl.removeSuffix("/")
        return """
            <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #888;">
              <a href="$url" style="color: #666; text-decoration: none;">
                <img src="cid:$EMAIL_SIGNATURE_LOGO_CID" alt="Konfiguruj" width="24" height="24" style="vertical-align: middle; margin-right: 6px;" />
              </a>
              <a href="$url" style="color: #666; text-decoration: none;">Created using $LINK_TEXT</a>
            </div>
            """.trimIndent()
    }

    /**
     * HTML signature without logo (text and link only). Use when logo cannot be embedded.
     */
    fun htmlWithoutLogo(siteUrl: String = SITE_URL): String {
        val url = siteUrl.removeSuffix("/")
        return """
            <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #888;">
              <a href="$url" style="color: #666; text-decoration: none;">Created using $LINK_TEXT</a>
            </div>
            """.trimIndent()
    }

    /**
     * Loads the logo from classpath:email/logo.png as InlineImage for embedding.
     * Returns null if the resource cannot be loaded.
     */
    fun loadLogoInlineImage(): InlineImage? {
        return try {
            val resource = ClassPathResource("email/logo.png")
            val bytes = resource.inputStream.use { it.readBytes() }
            val base64 = Base64.getEncoder().encodeToString(bytes)
            InlineImage(
                contentId = EMAIL_SIGNATURE_LOGO_CID,
                base64Data = "data:image/png;base64,$base64",
                mimeType = "image/png",
            )
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Plain text signature for fallback.
     */
    fun text(siteUrl: String = SITE_URL): String {
        val url = siteUrl.removeSuffix("/")
        return "\n\n---\nCreated using $url"
    }
}

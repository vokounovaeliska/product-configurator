package cz.vokounova.configurator.shared.email

import cz.vokounova.configurator.shared.email.ports.outbound.InlineImage
import org.springframework.core.io.ClassPathResource
import java.util.Base64

const val EMAIL_SIGNATURE_LOGO_CID = "logo"

object EmailSignature {
    private const val SITE_URL = "https://konfiguruj.com"
    private const val LINK_TEXT = "konfiguruj.com"

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

    fun htmlWithoutLogo(siteUrl: String = SITE_URL): String {
        val url = siteUrl.removeSuffix("/")
        return """
            <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #888;">
              <a href="$url" style="color: #666; text-decoration: none;">Created using $LINK_TEXT</a>
            </div>
            """.trimIndent()
    }

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

    fun text(siteUrl: String = SITE_URL): String {
        val url = siteUrl.removeSuffix("/")
        return "\n\n---\nCreated using $url"
    }
}

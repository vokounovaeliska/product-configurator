package cz.vokounova.configurator.customerrequest.application

import cz.vokounova.configurator.customerrequest.domain.CustomerRequest
import cz.vokounova.configurator.products.api.ProductConfigQueryFacade
import cz.vokounova.configurator.shared.email.EmailSignature
import cz.vokounova.configurator.shared.email.ports.outbound.EmailService
import cz.vokounova.configurator.shared.email.ports.outbound.InlineImage
import cz.vokounova.configurator.users.api.dto.UserDto
import org.springframework.beans.factory.annotation.Value
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service

@Service
class CustomerRequestEmailNotificationService(
    private val emailService: EmailService,
    private val productConfigQueryFacade: ProductConfigQueryFacade,
    @Value("\${app.site-url:}") private val siteUrl: String,
    @Value("\${app.mail.signature-enabled:true}") private val signatureEnabled: Boolean,
) {
    @Async
    fun sendQuoteRequestEmail(
        request: CustomerRequest,
        manufacturerEmail: String,
        owner: UserDto,
    ) {
        val productConfig =
            request.productModelId?.let {
                productConfigQueryFacade.getFullConfigByProductId(it)
            }
        val configPreviewImage =
            request.snapshotImageBase64?.takeIf { it.isNotBlank() }?.let { base64 ->
                InlineImage(
                    contentId = CONFIG_PREVIEW_CID,
                    base64Data =
                        if (base64.startsWith("data:")) {
                            base64
                        } else {
                            "data:image/png;base64,$base64"
                        },
                )
            }
        val logoImage = if (shouldAppendSignature()) EmailSignature.loadLogoInlineImage() else null
        val inlineImages =
            listOfNotNull(configPreviewImage, logoImage).takeIf { it.isNotEmpty() }

        val customerBodyHtml =
            maybeAppendSignature(
                QuoteRequestEmail.bodyHtml(request, owner, productConfig),
                logoAvailable = logoImage != null,
            )
        val customerBodyText =
            QuoteRequestEmail.bodyText(request, owner, productConfig) +
                if (shouldAppendSignature()) EmailSignature.text(siteUrl) else ""

        emailService.send(
            to = request.customerEmail,
            subject = QuoteRequestEmail.subject(request, owner),
            bodyHtml = customerBodyHtml,
            bodyText = customerBodyText,
            replyTo = manufacturerEmail,
            cc = null,
            inlineImages = inlineImages,
        )

        val supplierBodyHtml =
            maybeAppendSignature(
                SupplierNotificationEmail.bodyHtml(request, owner, productConfig),
                logoAvailable = logoImage != null,
            )
        val supplierBodyText =
            SupplierNotificationEmail.bodyText(request, owner, productConfig) +
                if (shouldAppendSignature()) EmailSignature.text(siteUrl) else ""

        emailService.send(
            to = manufacturerEmail,
            subject = SupplierNotificationEmail.subject(request, owner),
            bodyHtml = supplierBodyHtml,
            bodyText = supplierBodyText,
            replyTo = request.customerEmail,
            cc = null,
            inlineImages = inlineImages,
        )
    }

    private fun shouldAppendSignature(): Boolean = signatureEnabled && siteUrl.isNotBlank()

    private fun maybeAppendSignature(
        html: String,
        logoAvailable: Boolean,
    ): String =
        if (shouldAppendSignature()) {
            val signature =
                if (logoAvailable) {
                    EmailSignature.htmlWithLogo(siteUrl)
                } else {
                    EmailSignature.htmlWithoutLogo(siteUrl)
                }
            html.replace("</body></html>", "$signature</body></html>")
        } else {
            html
        }
}

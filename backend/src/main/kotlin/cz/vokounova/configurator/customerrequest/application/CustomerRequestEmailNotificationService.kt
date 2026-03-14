package cz.vokounova.configurator.customerrequest.application

import cz.vokounova.configurator.customerrequest.domain.CustomerRequest
import cz.vokounova.configurator.products.api.ProductConfigQueryFacade
import cz.vokounova.configurator.shared.email.ports.outbound.EmailService
import cz.vokounova.configurator.shared.email.ports.outbound.InlineImage
import cz.vokounova.configurator.users.api.dto.UserDto
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service

/**
 * Sends two emails when a quote request is submitted:
 * 1. Customer confirmation – to customer, replyTo=manufacturer (customer can reply to supplier).
 * 2. Supplier notification – to manufacturer, replyTo=customer (supplier can reply directly to customer).
 * Admin configures the customer email template via user-level publish settings.
 * Uses @Async so the HTTP response is not delayed by email delivery.
 */
@Service
class CustomerRequestEmailNotificationService(
    private val emailService: EmailService,
    private val productConfigQueryFacade: ProductConfigQueryFacade,
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
        val inlineImage =
            request.snapshotImageBase64?.takeIf { it.isNotBlank() }?.let { base64 ->
                InlineImage(
                    contentId = CONFIG_PREVIEW_CID,
                    base64Data = if (base64.startsWith("data:")) base64 else "data:image/png;base64,$base64",
                )
            }

        // 1. Customer confirmation – replyTo=manufacturer so customer can reply to supplier
        emailService.send(
            to = request.customerEmail,
            subject = QuoteRequestEmail.subject(request, owner),
            bodyHtml = QuoteRequestEmail.bodyHtml(request, owner, productConfig),
            bodyText = QuoteRequestEmail.bodyText(request, owner, productConfig),
            replyTo = manufacturerEmail,
            cc = null,
            inlineImage = inlineImage,
        )

        // 2. Supplier notification – replyTo=customer so supplier can reply directly to customer
        emailService.send(
            to = manufacturerEmail,
            subject = SupplierNotificationEmail.subject(request, owner),
            bodyHtml = SupplierNotificationEmail.bodyHtml(request, owner, productConfig),
            bodyText = SupplierNotificationEmail.bodyText(request, owner, productConfig),
            replyTo = request.customerEmail,
            cc = null,
            inlineImage = inlineImage,
        )
    }
}

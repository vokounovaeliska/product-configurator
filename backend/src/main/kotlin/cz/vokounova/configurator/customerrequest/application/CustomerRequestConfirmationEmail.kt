package cz.vokounova.configurator.customerrequest.application

import cz.vokounova.configurator.customerrequest.domain.CustomerRequest
import java.text.NumberFormat
import java.util.Currency
import java.util.Locale

/**
 * Builds the confirmation email sent to the customer after they submit a quote request.
 */
object CustomerRequestConfirmationEmail {
    fun subject(request: CustomerRequest): String {
        return "Your quote request has been received – ${request.productModelName}"
    }

    fun bodyHtml(request: CustomerRequest): String {
        val priceFormatted = formatPrice(request.totalPrice, request.currency)
        val customerName = request.customerName?.takeIf { it.isNotBlank() } ?: "Customer"
        val descBlock =
            request.productModelDescription?.takeIf { it.isNotBlank() }?.let {
                "<p style=\"margin: 0 0 8px 0;\"><strong>Description:</strong> ${escapeHtml(it)}</p>"
            } ?: ""
        val noteBlock =
            request.customerNote?.takeIf { it.isNotBlank() }?.let {
                "<p><strong>Your message:</strong></p><p>${escapeHtml(it)}</p>"
            } ?: ""

        val sb = StringBuilder()
        sb.append("<!DOCTYPE html><html><head><meta charset=\"UTF-8\">")
        sb.append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">")
        sb.append("</head><body style=\"font-family: system-ui, -apple-system, sans-serif; ")
        sb.append("line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;\">")
        sb.append("<h2 style=\"color: #1a1a1a;\">Thank you for your quote request</h2>")
        sb.append("<p>Dear $customerName,</p>")
        sb.append("<p>We have received your configuration request. Here is a summary of what you submitted:</p>")
        sb.append("<div style=\"background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 20px 0;\">")
        sb.append("<p style=\"margin: 0 0 8px 0;\"><strong>Product:</strong> ${escapeHtml(request.productModelName)}</p>")
        sb.append(descBlock)
        sb.append("<p style=\"margin: 0 0 8px 0;\"><strong>Total price:</strong> $priceFormatted</p>")
        sb.append("</div>")
        sb.append(noteBlock)
        sb.append("<p>We will review your request and get back to you as soon as possible.</p>")
        sb.append("<p>Best regards,<br>Product Configurator Team</p></body></html>")
        return sb.toString()
    }

    fun bodyText(request: CustomerRequest): String {
        val priceFormatted = formatPrice(request.totalPrice, request.currency)
        val customerName = request.customerName?.takeIf { it.isNotBlank() } ?: "Customer"
        val noteLine =
            request.customerNote?.takeIf { it.isNotBlank() }?.let { "\nYour message: $it" } ?: ""

        return "Thank you for your quote request\n\nDear $customerName,\n\n" +
            "We have received your configuration request. Here is a summary:\n\n" +
            "Product: ${request.productModelName}\n" +
            "Total price: $priceFormatted$noteLine\n\n" +
            "We will review your request and get back to you as soon as possible.\n\n" +
            "Best regards,\nProduct Configurator Team"
    }

    private fun formatPrice(
        cents: Int,
        currency: String,
    ): String {
        val amount = cents / 100.0
        val format = NumberFormat.getCurrencyInstance(Locale.GERMANY)
        format.currency = Currency.getInstance(currency)
        return format.format(amount)
    }

    private fun escapeHtml(s: String): String =
        s.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
}

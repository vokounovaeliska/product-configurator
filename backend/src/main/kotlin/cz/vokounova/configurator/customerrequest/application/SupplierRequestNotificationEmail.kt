package cz.vokounova.configurator.customerrequest.application

import cz.vokounova.configurator.customerrequest.domain.CustomerRequest
import java.text.NumberFormat
import java.util.Currency
import java.util.Locale

object SupplierRequestNotificationEmail {
    fun subject(request: CustomerRequest): String = "New quote request – ${request.productModelName}"

    fun bodyHtml(request: CustomerRequest): String {
        val priceFormatted = formatPrice(request.totalPriceCents, request.currency)
        val customerName = request.customerName?.takeIf { it.isNotBlank() } ?: "Not provided"
        val phone = request.customerPhone?.takeIf { it.isNotBlank() } ?: "Not provided"
        val note =
            request.customerNote?.takeIf { it.isNotBlank() }?.let { escapeHtml(it) } ?: "No message"

        return buildString {
            appendLine("<!DOCTYPE html>")
            appendLine("<html>")
            appendLine("  <head><meta charset=\"UTF-8\"></head>")
            appendLine("  <body style=\"font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333;\">")
            appendLine("    <h2>New quote request received</h2>")
            appendLine("    <p>A customer created a new request in your embedded configurator.</p>")
            appendLine("    <p><strong>Product:</strong> ${escapeHtml(request.productModelName)}</p>")
            appendLine("    <p><strong>Total price:</strong> $priceFormatted</p>")
            appendLine("    <p><strong>Customer name:</strong> ${escapeHtml(customerName)}</p>")
            appendLine("    <p><strong>Customer email:</strong> ${escapeHtml(request.customerEmail)}</p>")
            appendLine("    <p><strong>Customer phone:</strong> ${escapeHtml(phone)}</p>")
            appendLine("    <p><strong>Customer note:</strong><br>${note.replace("\n", "<br>")}</p>")
            appendLine("  </body>")
            appendLine("</html>")
        }
    }

    fun bodyText(request: CustomerRequest): String {
        val priceFormatted = formatPrice(request.totalPriceCents, request.currency)
        val customerName = request.customerName?.takeIf { it.isNotBlank() } ?: "Not provided"
        val phone = request.customerPhone?.takeIf { it.isNotBlank() } ?: "Not provided"
        val note = request.customerNote?.takeIf { it.isNotBlank() } ?: "No message"

        return buildString {
            appendLine("New quote request received")
            appendLine()
            appendLine("Product: ${request.productModelName}")
            appendLine("Total price: $priceFormatted")
            appendLine("Customer name: $customerName")
            appendLine("Customer email: ${request.customerEmail}")
            appendLine("Customer phone: $phone")
            appendLine("Customer note: $note")
        }
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

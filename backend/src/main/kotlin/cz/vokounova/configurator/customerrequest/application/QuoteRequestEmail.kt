package cz.vokounova.configurator.customerrequest.application

import cz.vokounova.configurator.customerrequest.domain.CustomerRequest
import cz.vokounova.configurator.products.api.dto.FullProductConfigDto
import cz.vokounova.configurator.users.api.dto.UserDto
import java.text.NumberFormat
import java.util.Currency
import java.util.Locale

/** Content-ID for inline configuration preview. Must match InlineImage.contentId when sending. */
const val CONFIG_PREVIEW_CID = "config-preview"

/**
 * Customer confirmation email. Admin configures the template in the administrator publish section (user-level).
 * Placeholders: {{customerName}}, {{productName}}, {{totalPrice}}, {{customerNote}}, {{customerEmail}}, {{customerPhone}}
 */
object QuoteRequestEmail {
    private const val PRESET_EN = "en"
    private const val PRESET_CS = "cs"

    private val DEFAULT_EN =
        EmailTemplate(
            subject = "Your quote request has been received – {{productName}}",
            body =
                "Dear {{customerName}},\n\nWe have received your configuration request. Here is a summary of what you submitted.\n\n" +
                    "We will review your request and get back to you as soon as possible.\n\nBest regards",
        )

    private val DEFAULT_CS =
        EmailTemplate(
            subject = "Vaše poptávka byla přijata – {{productName}}",
            body =
                "Vážený/á {{customerName}},\n\nobdrželi jsme vaši konfigurační poptávku. Níže je shrnutí toho, co jste odeslali.\n\n" +
                    "Vaši poptávku prozkoumáme a co nejdříve se vám ozveme.\n\nS pozdravem",
        )

    private data class EmailTemplate(val subject: String, val body: String)

    private data class EmailLabels(
        val product: String,
        val totalPrice: String,
        val description: String,
        val yourMessage: String,
        val phone: String,
        val yourChoices: String,
        val configurationPreview: String,
    )

    private val LABELS_EN =
        EmailLabels(
            product = "Product",
            totalPrice = "Total price",
            description = "Description",
            yourMessage = "Your message",
            phone = "Phone",
            yourChoices = "Your choices",
            configurationPreview = "Configuration preview",
        )

    private val LABELS_CS =
        EmailLabels(
            product = "Produkt",
            totalPrice = "Celková cena",
            description = "Popis",
            yourMessage = "Vaše zpráva",
            phone = "Telefon",
            yourChoices = "Vaše volby",
            configurationPreview = "Náhled konfigurace",
        )

    private fun labels(owner: UserDto): EmailLabels {
        val preset =
            when (owner.quoteRequestEmailTemplatePreset?.lowercase()) {
                PRESET_CS -> LABELS_CS
                else -> LABELS_EN
            }
        val overrides = owner.quoteRequestEmailLabels?.filterValues { it.isNotBlank() } ?: emptyMap()
        return EmailLabels(
            product = overrides["product"] ?: preset.product,
            totalPrice = overrides["totalPrice"] ?: preset.totalPrice,
            description = overrides["description"] ?: preset.description,
            yourMessage = overrides["yourMessage"] ?: preset.yourMessage,
            phone = overrides["phone"] ?: preset.phone,
            yourChoices = overrides["yourChoices"] ?: preset.yourChoices,
            configurationPreview = overrides["configurationPreview"] ?: preset.configurationPreview,
        )
    }

    private fun getTemplate(owner: UserDto): EmailTemplate {
        val preset = owner.quoteRequestEmailTemplatePreset?.takeIf { it.isNotBlank() }
        val customSubject = owner.quoteRequestEmailSubject?.takeIf { it.isNotBlank() }
        val customBody = owner.quoteRequestEmailBody?.takeIf { it.isNotBlank() }

        return when (preset?.lowercase()) {
            PRESET_CS -> DEFAULT_CS
            PRESET_EN -> DEFAULT_EN
            else ->
                if (customSubject != null && customBody != null) {
                    EmailTemplate(subject = customSubject, body = customBody)
                } else {
                    DEFAULT_EN
                }
        }
    }

    fun subject(
        request: CustomerRequest,
        owner: UserDto,
    ): String {
        val template = getTemplate(owner).subject
        return replacePlaceholders(template, request)
    }

    fun bodyHtml(
        request: CustomerRequest,
        owner: UserDto,
        productConfig: FullProductConfigDto? = null,
    ): String {
        val bodyTemplate = getTemplate(owner).body
        val intro =
            if (owner.quoteRequestEmailBodyIsHtml) {
                replacePlaceholdersForHtml(bodyTemplate, request)
            } else {
                replacePlaceholders(bodyTemplate, request).replace("\n", "<br>")
            }
        val priceFormatted = formatPrice(request.totalPrice, request.currency)
        val descBlock =
            request.productModelDescription?.takeIf { it.isNotBlank() }?.let {
                "<p style=\"margin: 0 0 8px 0;\"><strong>${labels(owner).description}:</strong> ${escapeHtml(it)}</p>"
            } ?: ""
        val noteBlock =
            request.customerNote?.takeIf { it.isNotBlank() }?.let {
                "<p style=\"margin: 8px 0 0 0;\"><strong>${labels(owner).yourMessage}:</strong> ${escapeHtml(it)}</p>"
            } ?: ""
        val phoneBlock =
            request.customerPhone?.takeIf { it.isNotBlank() }?.let {
                "<p style=\"margin: 0 0 8px 0;\"><strong>${labels(owner).phone}:</strong> ${escapeHtml(it)}</p>"
            } ?: ""
        val choices =
            ConfigurationChoiceFormatter.extractChoices(
                request.configurationJson,
                productConfig,
            )
        val choicesBlock =
            if (choices.isNotEmpty()) {
                val itemsHtml =
                    choices.joinToString("") { c ->
                        "<li style=\"margin: 2px 0;\">${escapeHtml(c.displayValue)}</li>"
                    }
                "<p style=\"margin: 8px 0 0 0;\"><strong>${labels(owner).yourChoices}:</strong></p>" +
                    "<ul style=\"margin: 4px 0 0 0; padding-left: 20px;\">$itemsHtml</ul>"
            } else {
                ""
            }

        val snapshotBlock =
            request.snapshotImageBase64?.takeIf { it.isNotBlank() }?.let {
                "<p style=\"margin: 16px 0 8px 0;\"><strong>${labels(owner).configurationPreview}:</strong></p>" +
                    "<p style=\"margin: 0;\"><img src=\"cid:$CONFIG_PREVIEW_CID\" alt=\"Configuration\" style=\"max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #e5e5e5;\" /></p>"
            } ?: ""

        return buildString {
            append("<!DOCTYPE html><html><head><meta charset=\"UTF-8\">")
            append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">")
            append("</head><body style=\"font-family: system-ui, -apple-system, sans-serif; ")
            append("line-height: 1.6; color: #333; font-size: 16px; max-width: 600px; margin: 0 auto; padding: 20px;\">")
            append(if (owner.quoteRequestEmailBodyIsHtml) "" else "<p>")
            append(intro)
            append(if (owner.quoteRequestEmailBodyIsHtml) "" else "</p>")
            append(
                "<div style=\"background: #fff; border-radius: 8px; padding: 16px; " +
                    "margin: 20px 0; border: 1px solid #e5e5e5; " +
                    "box-shadow: 0 1px 2px rgba(0,0,0,0.05);\">",
            )
            val lbl = labels(owner)
            append("<p style=\"margin: 0 0 8px 0;\"><strong>${lbl.product}:</strong> ${escapeHtml(request.productModelName)}</p>")
            append(phoneBlock)
            append(descBlock)
            append("<p style=\"margin: 0 0 8px 0;\"><strong>${lbl.totalPrice}:</strong> $priceFormatted</p>")
            append(choicesBlock)
            append(noteBlock)
            append("</div>")
            append(snapshotBlock)
            append("</body></html>")
        }
    }

    fun bodyText(
        request: CustomerRequest,
        owner: UserDto,
        productConfig: FullProductConfigDto? = null,
    ): String {
        val bodyTemplate = getTemplate(owner).body
        val intro =
            if (owner.quoteRequestEmailBodyIsHtml) {
                replacePlaceholders(bodyTemplate, request)
                    .replace(Regex("<[^>]+>"), " ")
                    .replace(Regex("\\s+"), " ")
                    .trim()
            } else {
                replacePlaceholders(bodyTemplate, request)
            }
        val priceFormatted = formatPrice(request.totalPrice, request.currency)
        val snapshotLine =
            if (request.snapshotImageBase64?.isNotBlank() == true) {
                "\n\n[${labels(owner).configurationPreview}: see HTML version]"
            } else {
                ""
            }
        val noteLine =
            request.customerNote?.takeIf { it.isNotBlank() }?.let {
                "\n${labels(owner).yourMessage}: $it"
            } ?: ""
        val phoneLine =
            request.customerPhone?.takeIf { it.isNotBlank() }?.let {
                "\n${labels(owner).phone}: $it"
            } ?: ""
        val choices =
            ConfigurationChoiceFormatter.extractChoices(
                request.configurationJson,
                productConfig,
            )
        val choicesLine =
            if (choices.isNotEmpty()) {
                "\n${labels(owner).yourChoices}: " + choices.joinToString(", ") { it.displayValue }
            } else {
                ""
            }
        val lbl = labels(owner)
        return buildString {
            append("$intro\n\n${lbl.product}: ${request.productModelName}$phoneLine")
            append("\n${lbl.totalPrice}: $priceFormatted")
            append(choicesLine)
            append(noteLine)
            append(snapshotLine)
        }
    }

    private fun replacePlaceholders(
        template: String,
        request: CustomerRequest,
    ): String =
        template
            .replace("{{customerName}}", request.customerName?.takeIf { it.isNotBlank() } ?: "Customer")
            .replace("{{productName}}", request.productModelName)
            .replace("{{totalPrice}}", formatPrice(request.totalPrice, request.currency))
            .replace("{{customerNote}}", request.customerNote?.takeIf { it.isNotBlank() } ?: "")
            .replace("{{customerEmail}}", request.customerEmail)
            .replace("{{customerPhone}}", request.customerPhone?.takeIf { it.isNotBlank() } ?: "")

    /** Replaces placeholders with HTML-escaped values for safe insertion into HTML body */
    private fun replacePlaceholdersForHtml(
        template: String,
        request: CustomerRequest,
    ): String =
        template
            .replace(
                "{{customerName}}",
                escapeHtml(request.customerName?.takeIf { it.isNotBlank() } ?: "Customer"),
            )
            .replace("{{productName}}", escapeHtml(request.productModelName))
            .replace("{{totalPrice}}", escapeHtml(formatPrice(request.totalPrice, request.currency)))
            .replace(
                "{{customerNote}}",
                escapeHtml(request.customerNote?.takeIf { it.isNotBlank() } ?: ""),
            )
            .replace("{{customerEmail}}", escapeHtml(request.customerEmail))
            .replace(
                "{{customerPhone}}",
                escapeHtml(request.customerPhone?.takeIf { it.isNotBlank() } ?: ""),
            )

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

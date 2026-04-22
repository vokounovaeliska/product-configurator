package cz.vokounova.configurator.customerrequest.application

import cz.vokounova.configurator.customerrequest.domain.CustomerRequest
import cz.vokounova.configurator.products.api.dto.FullProductConfigDto
import cz.vokounova.configurator.users.api.dto.UserDto
import java.text.NumberFormat
import java.util.Currency
import java.util.Locale


object SupplierNotificationEmail {
    private const val PRESET_EN = "en"
    private const val PRESET_CS = "cs"

    private val DEFAULT_EN =
        EmailTemplate(
            subject = "New quote request: {{productName}} from {{customerName}}",
            body =
                "You have received a new quote request.\n\n" +
                    "Reply to this email to respond directly to the customer.",
        )

    private val DEFAULT_CS =
        EmailTemplate(
            subject = "Nová cenová poptávka: {{productName}} od {{customerName}}",
            body =
                "Obdrželi jste novou cenovou poptávku.\n\n" +
                    "Odpovězte na tento e-mail pro přímou odpověď zákazníkovi.",
        )

    private data class EmailTemplate(val subject: String, val body: String)

    private data class EmailLabels(
        val customer: String,
        val phone: String,
        val product: String,
        val totalPrice: String,
        val description: String,
        val customerMessage: String,
        val customerChoices: String,
        val configurationPreview: String,
    )

    private val LABELS_EN =
        EmailLabels(
            customer = "Customer",
            phone = "Phone",
            product = "Product",
            totalPrice = "Total price",
            description = "Description",
            customerMessage = "Customer message",
            customerChoices = "Customer choices",
            configurationPreview = "Configuration preview",
        )

    private val LABELS_CS =
        EmailLabels(
            customer = "Zákazník",
            phone = "Telefon",
            product = "Produkt",
            totalPrice = "Celková cena",
            description = "Popis",
            customerMessage = "Zpráva zákazníka",
            customerChoices = "Volby zákazníka",
            configurationPreview = "Náhled konfigurace",
        )

    private fun labels(owner: UserDto): EmailLabels {
        val preset =
            when (owner.supplierNotificationEmailTemplatePreset?.lowercase()) {
                PRESET_CS -> LABELS_CS
                else -> LABELS_EN
            }
        val overrides =
            owner.supplierNotificationEmailLabels?.filterValues { it.isNotBlank() } ?: emptyMap()
        return EmailLabels(
            customer = overrides["customer"] ?: preset.customer,
            phone = overrides["phone"] ?: preset.phone,
            product = overrides["product"] ?: preset.product,
            totalPrice = overrides["totalPrice"] ?: preset.totalPrice,
            description = overrides["description"] ?: preset.description,
            customerMessage = overrides["customerMessage"] ?: preset.customerMessage,
            customerChoices = overrides["customerChoices"] ?: preset.customerChoices,
            configurationPreview =
                overrides["configurationPreview"] ?: preset.configurationPreview,
        )
    }

    private fun getTemplate(owner: UserDto): EmailTemplate {
        val preset =
            owner.supplierNotificationEmailTemplatePreset?.takeIf { it.isNotBlank() }
        val customSubject =
            owner.supplierNotificationEmailSubject?.takeIf { it.isNotBlank() }
        val customBody =
            owner.supplierNotificationEmailBody?.takeIf { it.isNotBlank() }

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

    private fun replacePlaceholders(
        template: String,
        request: CustomerRequest,
    ): String =
        template
            .replace(
                "{{customerName}}",
                request.customerName?.takeIf { it.isNotBlank() } ?: request.customerEmail,
            )
            .replace("{{productName}}", request.productModelName)
            .replace("{{totalPrice}}", formatPrice(request.totalPrice, request.currency))
            .replace("{{customerNote}}", request.customerNote?.takeIf { it.isNotBlank() } ?: "")
            .replace("{{customerEmail}}", request.customerEmail)
            .replace(
                "{{customerPhone}}",
                request.customerPhone?.takeIf { it.isNotBlank() } ?: "",
            )

    private fun replacePlaceholdersForHtml(
        template: String,
        request: CustomerRequest,
    ): String =
        template
            .replace(
                "{{customerName}}",
                escapeHtml(
                    request.customerName?.takeIf { it.isNotBlank() } ?: request.customerEmail,
                ),
            )
            .replace("{{productName}}", escapeHtml(request.productModelName))
            .replace(
                "{{totalPrice}}",
                escapeHtml(formatPrice(request.totalPrice, request.currency)),
            )
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
            if (owner.supplierNotificationEmailBodyIsHtml) {
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
                "<p style=\"margin: 8px 0 0 0;\"><strong>${labels(owner).customerMessage}:</strong> ${escapeHtml(it)}</p>"
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
                "<p style=\"margin: 8px 0 0 0;\"><strong>${labels(owner).customerChoices}:</strong></p>" +
                    "<ul style=\"margin: 4px 0 0 0; padding-left: 20px;\">$itemsHtml</ul>"
            } else {
                ""
            }
        val snapshotBlock =
            request.snapshotImageBase64?.takeIf { it.isNotBlank() }?.let {
                "<p style=\"margin: 16px 0 8px 0;\"><strong>${labels(owner).configurationPreview}:</strong></p>" +
                    "<p style=\"margin: 0;\"><img src=\"cid:$CONFIG_PREVIEW_CID\" alt=\"Configuration\" " +
                    "style=\"max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #e5e5e5;\" /></p>"
            } ?: ""

        return buildString {
            append("<!DOCTYPE html><html><head><meta charset=\"UTF-8\">")
            append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">")
            append("</head><body style=\"font-family: system-ui, -apple-system, sans-serif; ")
            append("line-height: 1.6; color: #333; font-size: 16px; max-width: 600px; margin: 0 auto; padding: 20px;\">")
            append(if (owner.supplierNotificationEmailBodyIsHtml) "" else "<p>")
            append(intro)
            append(if (owner.supplierNotificationEmailBodyIsHtml) "" else "</p>")
            append(
                "<div style=\"background: #fff; border-radius: 8px; padding: 16px; " +
                    "margin: 20px 0; border: 1px solid #e5e5e5; " +
                    "box-shadow: 0 1px 2px rgba(0,0,0,0.05);\">",
            )
            val lbl = labels(owner)
            val customerDisplay =
                escapeHtml(request.customerName?.takeIf { it.isNotBlank() } ?: "—")
            val customerEmailEscaped = escapeHtml(request.customerEmail)
            append(
                "<p style=\"margin: 0 0 8px 0;\"><strong>${lbl.customer}:</strong> $customerDisplay " +
                    "&lt;$customerEmailEscaped&gt;</p>",
            )
            request.customerPhone?.takeIf { it.isNotBlank() }?.let {
                append("<p style=\"margin: 0 0 8px 0;\"><strong>${lbl.phone}:</strong> ${escapeHtml(it)}</p>")
            }
            append("<p style=\"margin: 0 0 8px 0;\"><strong>${lbl.product}:</strong> ${escapeHtml(request.productModelName)}</p>")
            append(descBlock)
            append("<p style=\"margin: 0 0 8px 0;\"><strong>${lbl.totalPrice}:</strong> $priceFormatted</p>")
            append(choicesBlock)
            append(noteBlock)
            append("</div>")
            append(snapshotBlock)
            append(
                "<p style=\"margin-top: 20px; font-size: 14px; color: #666;\">" +
                    "Reply to this email to respond directly to the customer.</p>",
            )
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
            if (owner.supplierNotificationEmailBodyIsHtml) {
                replacePlaceholders(bodyTemplate, request)
                    .replace(Regex("<[^>]+>"), " ")
                    .replace(Regex("\\s+"), " ")
                    .trim()
            } else {
                replacePlaceholders(bodyTemplate, request)
            }
        val priceFormatted = formatPrice(request.totalPrice, request.currency)
        val lbl = labels(owner)
        val noteLine =
            request.customerNote?.takeIf { it.isNotBlank() }?.let {
                "\n${lbl.customerMessage}: $it"
            } ?: ""
        val choices =
            ConfigurationChoiceFormatter.extractChoices(
                request.configurationJson,
                productConfig,
            )
        val choicesLine =
            if (choices.isNotEmpty()) {
                "\n${lbl.customerChoices}: " + choices.joinToString(", ") { it.displayValue }
            } else {
                ""
            }
        val snapshotLine =
            if (request.snapshotImageBase64?.isNotBlank() == true) {
                "\n\n[${lbl.configurationPreview}: see HTML version]"
            } else {
                ""
            }
        return buildString {
            append("$intro\n\n")
            append("${lbl.customer}: ${request.customerName?.takeIf { it.isNotBlank() } ?: "—"} <${request.customerEmail}>\n")
            request.customerPhone?.takeIf { it.isNotBlank() }?.let {
                append("${lbl.phone}: $it\n")
            }
            append("${lbl.product}: ${request.productModelName}\n")
            append("${lbl.totalPrice}: $priceFormatted")
            append(choicesLine)
            append(noteLine)
            append(snapshotLine)
            append("\n\nReply to this email to respond directly to the customer.")
        }
    }
}

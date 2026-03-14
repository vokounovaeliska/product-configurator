package cz.vokounova.configurator.users.infrastructure.rest.mapper.request

data class UserPatchRequestDto(
    val path: Path,
    val value: Any?,
    val op: Op,
) {
    enum class Path {
        SlashFirstName,
        SlashSurname,
        SlashEmail,
        SlashNotificationEmail,
        SlashQuoteRequestEmailTemplatePreset,
        SlashQuoteRequestEmailSubject,
        SlashQuoteRequestEmailBody,
        SlashQuoteRequestEmailBodyIsHtml,
        SlashQuoteRequestEmailLabels,
        SlashSupplierNotificationEmailTemplatePreset,
        SlashSupplierNotificationEmailSubject,
        SlashSupplierNotificationEmailBody,
        SlashSupplierNotificationEmailBodyIsHtml,
        SlashSupplierNotificationEmailLabels,
        SlashIsActive,
    }

    enum class Op {
        Replace,
    }
}

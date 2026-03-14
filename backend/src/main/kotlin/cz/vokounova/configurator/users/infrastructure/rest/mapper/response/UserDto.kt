package cz.vokounova.configurator.users.infrastructure.rest.mapper.response

import java.time.OffsetDateTime
import java.util.*

data class UserDto(
    val id: UUID,
    val firstName: String,
    val surname: String,
    val email: String,
    val notificationEmail: String?,
    val quoteRequestEmailTemplatePreset: String?,
    val quoteRequestEmailSubject: String?,
    val quoteRequestEmailBody: String?,
    val quoteRequestEmailBodyIsHtml: Boolean?,
    val quoteRequestEmailLabels: Map<String, String>?,
    val supplierNotificationEmailTemplatePreset: String?,
    val supplierNotificationEmailSubject: String?,
    val supplierNotificationEmailBody: String?,
    val supplierNotificationEmailBodyIsHtml: Boolean?,
    val supplierNotificationEmailLabels: Map<String, String>?,
    val createdAt: OffsetDateTime,
    val modifiedAt: OffsetDateTime,
)

package cz.vokounova.configurator.users.api.dto

import cz.vokounova.configurator.users.domain.User
import java.time.OffsetDateTime

data class UserDto(
    val id: UserIdDto,
    val firstName: String,
    val surname: String,
    val email: String,
    val notificationEmail: String?,
    val quoteRequestEmailTemplatePreset: String?,
    val quoteRequestEmailSubject: String?,
    val quoteRequestEmailBody: String?,
    val quoteRequestEmailBodyIsHtml: Boolean,
    val quoteRequestEmailLabels: Map<String, String>?,
    val supplierNotificationEmailTemplatePreset: String?,
    val supplierNotificationEmailSubject: String?,
    val supplierNotificationEmailBody: String?,
    val supplierNotificationEmailBodyIsHtml: Boolean,
    val supplierNotificationEmailLabels: Map<String, String>?,
    val createdAt: OffsetDateTime,
    val modifiedAt: OffsetDateTime,
    val password: String,
    val checksum: String,
) {
    companion object {
        fun fromDomain(domain: User) =
            UserDto(
                id = UserIdDto.fromDomain(domain.id),
                firstName = domain.firstName,
                surname = domain.surname,
                email = domain.email,
                notificationEmail = domain.notificationEmail,
                quoteRequestEmailTemplatePreset = domain.quoteRequestEmailTemplatePreset,
                quoteRequestEmailSubject = domain.quoteRequestEmailSubject,
                quoteRequestEmailBody = domain.quoteRequestEmailBody,
                quoteRequestEmailBodyIsHtml = domain.quoteRequestEmailBodyIsHtml,
                quoteRequestEmailLabels = domain.quoteRequestEmailLabels,
                supplierNotificationEmailTemplatePreset =
                    domain.supplierNotificationEmailTemplatePreset,
                supplierNotificationEmailSubject = domain.supplierNotificationEmailSubject,
                supplierNotificationEmailBody = domain.supplierNotificationEmailBody,
                supplierNotificationEmailBodyIsHtml = domain.supplierNotificationEmailBodyIsHtml,
                supplierNotificationEmailLabels = domain.supplierNotificationEmailLabels,
                createdAt = domain.createdAt,
                modifiedAt = domain.modifiedAt,
                password = domain.password,
                checksum = domain.checkSum,
            )
    }

    fun toDomain(): User =
        User(
            id = id.toDomain(),
            firstName = firstName,
            email = email,
            surname = surname,
            notificationEmail = notificationEmail,
            quoteRequestEmailTemplatePreset = quoteRequestEmailTemplatePreset,
            quoteRequestEmailSubject = quoteRequestEmailSubject,
            quoteRequestEmailBody = quoteRequestEmailBody,
            quoteRequestEmailBodyIsHtml = quoteRequestEmailBodyIsHtml,
            quoteRequestEmailLabels = quoteRequestEmailLabels,
            supplierNotificationEmailTemplatePreset = supplierNotificationEmailTemplatePreset,
            supplierNotificationEmailSubject = supplierNotificationEmailSubject,
            supplierNotificationEmailBody = supplierNotificationEmailBody,
            supplierNotificationEmailBodyIsHtml = supplierNotificationEmailBodyIsHtml,
            supplierNotificationEmailLabels = supplierNotificationEmailLabels,
            password = password,
            createdAt = createdAt,
            modifiedAt = modifiedAt,
            checkSum = checksum,
        )

    fun fullName(): String = "$firstName $surname"
}

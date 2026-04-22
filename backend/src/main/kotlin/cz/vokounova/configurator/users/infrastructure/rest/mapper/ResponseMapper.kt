package cz.vokounova.configurator.users.infrastructure.rest.mapper

import cz.vokounova.configurator.users.domain.User
import cz.vokounova.configurator.users.infrastructure.rest.mapper.response.UserDto

fun User.toDto(): UserDto =
    UserDto(
        id = id.value,
        firstName = firstName,
        surname = surname,
        email = email,
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
        createdAt = createdAt,
        modifiedAt = modifiedAt,
    )

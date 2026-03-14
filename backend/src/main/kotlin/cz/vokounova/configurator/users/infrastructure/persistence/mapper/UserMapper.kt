package cz.vokounova.configurator.users.infrastructure.persistence.mapper

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import cz.vokounova.configurator.generated.jooq.tables.records.UserRecord
import cz.vokounova.configurator.users.domain.User
import cz.vokounova.configurator.users.domain.UserId
import org.jooq.JSONB

private val MAP_STRING_STRING = object : TypeReference<Map<String, String>>() {}

fun User.toPersistence(objectMapper: ObjectMapper): UserRecord {
    val quoteLabelsJson =
        quoteRequestEmailLabels?.let { JSONB.valueOf(objectMapper.writeValueAsString(it)) }
    val supplierLabelsJson =
        supplierNotificationEmailLabels?.let { JSONB.valueOf(objectMapper.writeValueAsString(it)) }
    return UserRecord(
        id = id.value,
        firstName = firstName,
        surname = surname,
        email = email,
        notificationEmail = notificationEmail,
        quoteRequestEmailTemplatePreset = quoteRequestEmailTemplatePreset,
        quoteRequestEmailSubject = quoteRequestEmailSubject,
        quoteRequestEmailBody = quoteRequestEmailBody,
        quoteRequestEmailBodyIsHtml = quoteRequestEmailBodyIsHtml,
        quoteRequestEmailLabels = quoteLabelsJson,
        supplierNotificationEmailTemplatePreset = supplierNotificationEmailTemplatePreset,
        supplierNotificationEmailSubject = supplierNotificationEmailSubject,
        supplierNotificationEmailBody = supplierNotificationEmailBody,
        supplierNotificationEmailBodyIsHtml = supplierNotificationEmailBodyIsHtml,
        supplierNotificationEmailLabels = supplierLabelsJson,
        password = password,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
        checkSum = checkSum,
    )
}

fun UserRecord.toDomain(objectMapper: ObjectMapper): User {
    val quoteLabels =
        quoteRequestEmailLabels?.data()?.let {
            objectMapper.readValue(it, MAP_STRING_STRING)
        }
    val supplierLabels =
        supplierNotificationEmailLabels?.data()?.let {
            objectMapper.readValue(it, MAP_STRING_STRING)
        }
    return User(
        id = UserId(id),
        firstName = firstName,
        surname = surname,
        email = email,
        notificationEmail = notificationEmail,
        quoteRequestEmailTemplatePreset = quoteRequestEmailTemplatePreset,
        quoteRequestEmailSubject = quoteRequestEmailSubject,
        quoteRequestEmailBody = quoteRequestEmailBody,
        quoteRequestEmailBodyIsHtml = quoteRequestEmailBodyIsHtml ?: false,
        quoteRequestEmailLabels = quoteLabels,
        supplierNotificationEmailTemplatePreset = supplierNotificationEmailTemplatePreset,
        supplierNotificationEmailSubject = supplierNotificationEmailSubject,
        supplierNotificationEmailBody = supplierNotificationEmailBody,
        supplierNotificationEmailBodyIsHtml = supplierNotificationEmailBodyIsHtml ?: false,
        supplierNotificationEmailLabels = supplierLabels,
        password = password,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
        checkSum = checkSum,
    )
}

package cz.vokounova.configurator.users.domain

import cz.vokounova.configurator.shared.security.AuthId
import cz.vokounova.configurator.shared.utils.getMd5Hash
import java.time.OffsetDateTime
import java.util.UUID

@JvmInline
value class UserId(
    val value: UUID,
) {
    companion object {
        fun from(authId: AuthId): UserId = UserId(authId.value)
    }
}

data class User(
    val id: UserId,
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
    val password: String,
    val createdAt: OffsetDateTime,
    val modifiedAt: OffsetDateTime,
    val checkSum: String,
) {
    companion object {
        const val PASSWORD_PATTERN: String = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+\$"
        const val PASSWORD_LENGTH_MIN: Int = 8
        const val PASSWORD_LENGTH_MAX: Int = 50

        fun create(params: UserCreateParams): User {
            val timestamp = OffsetDateTime.now()
            return User(
                id = UserId(UUID.randomUUID()),
                firstName = params.firstName,
                surname = params.surname,
                email = params.email,
                notificationEmail = null,
                quoteRequestEmailTemplatePreset = null,
                quoteRequestEmailSubject = null,
                quoteRequestEmailBody = null,
                quoteRequestEmailBodyIsHtml = false,
                quoteRequestEmailLabels = null,
                supplierNotificationEmailTemplatePreset = null,
                supplierNotificationEmailSubject = null,
                supplierNotificationEmailBody = null,
                supplierNotificationEmailBodyIsHtml = false,
                supplierNotificationEmailLabels = null,
                password = params.password,
                createdAt = timestamp,
                modifiedAt = timestamp,
                checkSum = "will-be-recalculated",
            )
        }
    }

    fun fullName(): String = "$firstName $surname"
}

fun User.getChecksum(): String {
    val extra =
        "$quoteRequestEmailTemplatePreset$quoteRequestEmailSubject$quoteRequestEmailBody$quoteRequestEmailBodyIsHtml" +
            "$quoteRequestEmailLabels" +
            "$supplierNotificationEmailTemplatePreset$supplierNotificationEmailSubject$supplierNotificationEmailBody" +
            "$supplierNotificationEmailBodyIsHtml$supplierNotificationEmailLabels"
    return "${id.value}$firstName$surname$email$notificationEmail$extra$password".getMd5Hash()
}

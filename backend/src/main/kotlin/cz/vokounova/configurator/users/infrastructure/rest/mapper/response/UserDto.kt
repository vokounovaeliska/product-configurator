package cz.vokounova.configurator.users.infrastructure.rest.mapper.response

import java.time.OffsetDateTime
import java.util.*

data class UserDto(
    val id: UUID,
    val firstName: String,
    val surname: String,
    val email: String,
    val notificationEmail: String?,
    val createdAt: OffsetDateTime,
    val modifiedAt: OffsetDateTime,
)

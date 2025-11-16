package cz.vokounova.configurator.users.api.dto

import cz.vokounova.configurator.users.domain.UserId
import java.util.UUID

@JvmInline
value class UserIdDto(
    val value: UUID,
) {
    companion object {
        fun fromDomain(domain: UserId): UserIdDto = UserIdDto(domain.value)
    }

    fun toDomain(): UserId = UserId(value)
}

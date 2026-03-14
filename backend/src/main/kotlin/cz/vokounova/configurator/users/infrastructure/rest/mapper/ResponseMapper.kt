package cz.vokounova.configurator.users.infrastructure.rest.mapper

import cz.vokounova.configurator.users.domain.User
import cz.vokounova.configurator.users.infrastructure.rest.mapper.response.UserDto

/**
 * Maps domain User to external Dto
 */
fun User.toDto(): UserDto =
    UserDto(
        id = id.value,
        firstName = firstName,
        surname = surname,
        email = email,
        notificationEmail = notificationEmail,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
    )

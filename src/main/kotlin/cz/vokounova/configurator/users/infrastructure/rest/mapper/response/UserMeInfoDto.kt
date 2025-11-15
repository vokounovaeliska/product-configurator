package cz.vokounova.configurator.users.infrastructure.rest.mapper.response

import java.util.*

data class UserMeInfoDto(
    val id: UUID,
    val fullName: String,
)

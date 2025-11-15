package cz.vokounova.configurator.users.api

import cz.vokounova.configurator.users.api.dto.UserDto
import cz.vokounova.configurator.users.api.dto.UserIdDto

interface UserFacade {
    fun getUser(
        id: UserIdDto,
        lock: Boolean,
    ): UserDto

    fun getUsersByIds(ids: List<UserIdDto>): List<UserDto>

    fun deleteMultiple(ids: Set<UserIdDto>): Int
}

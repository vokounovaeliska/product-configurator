package cz.vokounova.configurator.users.application.usecase

import cz.vokounova.configurator.shared.exceptions.ResourceNotFoundException
import cz.vokounova.configurator.users.api.UserFacade
import cz.vokounova.configurator.users.api.dto.UserDto
import cz.vokounova.configurator.users.api.dto.UserIdDto
import cz.vokounova.configurator.users.domain.UserFilter
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.ports.outbound.UserRepository
import org.springframework.stereotype.Component

@Component
class UserFacadeManager(
    private val repository: UserRepository,
) : UserFacade {
    override fun getUser(
        id: UserIdDto,
        lock: Boolean,
    ): UserDto =
        repository.findById(UserId(id.value), lock)?.let {
            UserDto.fromDomain(it)
        } ?: throw ResourceNotFoundException("User with id $id is not found")

    override fun getUsersByIds(ids: List<UserIdDto>): List<UserDto> =
        repository
            .findByFilter(filter = UserFilter(ids = ids.map { it.toDomain() }))
            .map { UserDto.fromDomain(it) }

    override fun deleteMultiple(ids: Set<UserIdDto>): Int = repository.deleteMultiple(ids.map { it.toDomain() }.toSet())
}

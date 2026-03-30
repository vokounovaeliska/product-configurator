package cz.vokounova.configurator.users.ports.outbound

import cz.vokounova.configurator.shared.pagination.PaginatedResult
import cz.vokounova.configurator.shared.pagination.PaginationRequest
import cz.vokounova.configurator.users.domain.User
import cz.vokounova.configurator.users.domain.UserFilter
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.domain.UserSortableField

interface UserRepository {
    fun findByEmail(email: String): User?

    fun findById(
        id: UserId,
        lock: Boolean,
    ): User?

    fun findByFilter(filter: UserFilter? = null): List<User>

    fun create(user: User): User?

    fun update(user: User): User?

    fun updatePassword(user: User)

    fun delete(id: UserId): Int

    fun deleteMultiple(ids: Set<UserId>): Int

    fun findByFilterPaginated(
        filter: UserFilter,
        paginationRequest: PaginationRequest<UserSortableField>,
    ): PaginatedResult<User>

    fun existsForEmail(
        email: String,
        excludeUserId: UserId? = null,
    ): Boolean
}

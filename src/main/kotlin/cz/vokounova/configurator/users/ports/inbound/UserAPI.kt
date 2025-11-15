package cz.vokounova.configurator.users.ports.inbound

import cz.vokounova.configurator.shared.pagination.PaginatedResult
import cz.vokounova.configurator.shared.pagination.PaginationRequest
import cz.vokounova.configurator.users.domain.User
import cz.vokounova.configurator.users.domain.UserChangePasswordParams
import cz.vokounova.configurator.users.domain.UserCreateParams
import cz.vokounova.configurator.users.domain.UserFilter
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.domain.UserJsonPatchParams
import cz.vokounova.configurator.users.domain.UserMeChangePasswordParams
import cz.vokounova.configurator.users.domain.UserSortableField

interface UserAPI {
    fun create(params: UserCreateParams): User

    fun delete(id: UserId)

    fun getOne(id: UserId): User

    fun getList(): List<User>

    fun patch(
        id: UserId,
        jsonPatchParams: List<UserJsonPatchParams>,
    ): User

    fun getCurrentUser(): User

    fun changePassword(
        id: UserId,
        params: UserChangePasswordParams,
    )

    fun changePassword(params: UserMeChangePasswordParams)

    fun getByFilterPaginated(
        filter: UserFilter,
        paginationRequest: PaginationRequest<UserSortableField>,
    ): PaginatedResult<User>
}

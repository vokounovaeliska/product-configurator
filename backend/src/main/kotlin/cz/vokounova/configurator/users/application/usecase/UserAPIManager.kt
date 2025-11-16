package cz.vokounova.configurator.users.application.usecase

import cz.vokounova.configurator.shared.exceptions.ResourceNotFoundException
import cz.vokounova.configurator.shared.exceptions.throwIfNotEmpty
import cz.vokounova.configurator.shared.jsonpatch.JsonPatchUtils
import cz.vokounova.configurator.shared.pagination.PaginatedResult
import cz.vokounova.configurator.shared.pagination.PaginationRequest
import cz.vokounova.configurator.shared.security.AuthFacade
import cz.vokounova.configurator.users.application.exception.UserErrorCode
import cz.vokounova.configurator.users.application.exception.UserException
import cz.vokounova.configurator.users.application.validation.UserEmailValidator
import cz.vokounova.configurator.users.application.validation.UserEmailValidatorParams
import cz.vokounova.configurator.users.domain.User
import cz.vokounova.configurator.users.domain.UserChangePasswordParams
import cz.vokounova.configurator.users.domain.UserCreateParams
import cz.vokounova.configurator.users.domain.UserFilter
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.domain.UserJsonPatchParams
import cz.vokounova.configurator.users.domain.UserMeChangePasswordParams
import cz.vokounova.configurator.users.domain.UserSortableField
import cz.vokounova.configurator.users.ports.inbound.UserAPI
import cz.vokounova.configurator.users.ports.outboud.UserRepository
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

@Component
class UserAPIManager(
    private val userRepository: UserRepository,
    private val jsonPatchUtils: JsonPatchUtils,
    private val authFacade: AuthFacade,
    private val userEmailValidator: UserEmailValidator,
) : UserAPI {
    @Transactional
    override fun create(params: UserCreateParams): User {
        userEmailValidator.validate(UserEmailValidatorParams(createParams = params)).throwIfNotEmpty()
        val user = User.create(params)
        return userRepository.create(user) ?: throw UserException(UserErrorCode.CREATE_USER_FAILED)
    }

    @Transactional
    override fun delete(id: UserId) {
        val deletedCount = userRepository.delete(id)
        if (deletedCount == 0) {
            throw ResourceNotFoundException("User with id ${id.value} not found")
        }
    }

    override fun getOne(id: UserId): User = findUser(id)

    override fun getList(): List<User> = userRepository.findByFilter()

    @Transactional
    override fun patch(
        id: UserId,
        jsonPatchParams: List<UserJsonPatchParams>,
    ): User {
        val existingUser = findUser(id, lock = true)
        userEmailValidator
            .validate(
                UserEmailValidatorParams(jsonPatchParams = jsonPatchParams, existingUser = existingUser),
            ).throwIfNotEmpty()

        val patched = jsonPatchUtils.applyAndMapJsonPatch(jsonPatchParams, existingUser)

        return userRepository.update(patched) ?: throw UserException(UserErrorCode.UPDATE_USER_FAILED)
    }

    override fun getCurrentUser(): User {
        val currentUserId = authFacade.getCurrentAuthDetails().id()
        return findUser(UserId(currentUserId.value))
    }

    override fun changePassword(
        id: UserId,
        params: UserChangePasswordParams,
    ) {
        val existingUser = findUser(id, lock = true)
        val updatedUser = existingUser.copy(password = params.newPassword)
        userRepository.updatePassword(updatedUser)
    }

    override fun changePassword(params: UserMeChangePasswordParams) {
        val currentUser = getCurrentUser()
        val updatedUser = currentUser.copy(password = params.newPassword)
        userRepository.updatePassword(updatedUser)
    }

    override fun getByFilterPaginated(
        filter: UserFilter,
        paginationRequest: PaginationRequest<UserSortableField>,
    ): PaginatedResult<User> = userRepository.findByFilterPaginated(filter, paginationRequest)

    private fun findUser(
        id: UserId,
        lock: Boolean = false,
    ): User =
        userRepository.findById(id, lock)
            ?: throw ResourceNotFoundException("User with id ${id.value} is not found.")
}

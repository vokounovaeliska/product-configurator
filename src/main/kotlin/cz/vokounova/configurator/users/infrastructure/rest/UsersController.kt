package cz.vokounova.configurator.users.infrastructure.rest

import cz.vokounova.configurator.shared.exceptions.throwIfNotEmpty
import cz.vokounova.configurator.shared.pagination.PaginationUtils
import cz.vokounova.configurator.shared.pagination.SortingUtils
import cz.vokounova.configurator.shared.rest.response.PaginatedResponseMetaDto
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.domain.UserSortableField
import cz.vokounova.configurator.users.domain.UserSortingConfig
import cz.vokounova.configurator.users.infrastructure.rest.mapper.request.UserChangePasswordRequestDto
import cz.vokounova.configurator.users.infrastructure.rest.mapper.request.UserCreateRequestDto
import cz.vokounova.configurator.users.infrastructure.rest.mapper.request.UserMeChangePasswordRequestDto
import cz.vokounova.configurator.users.infrastructure.rest.mapper.request.UserPatchRequestDto
import cz.vokounova.configurator.users.infrastructure.rest.mapper.response.UserDto
import cz.vokounova.configurator.users.infrastructure.rest.mapper.response.UserPaginatedResponseDto
import cz.vokounova.configurator.users.infrastructure.rest.mapper.toDto
import cz.vokounova.configurator.users.infrastructure.rest.mapper.toFilter
import cz.vokounova.configurator.users.infrastructure.rest.mapper.toParams
import cz.vokounova.configurator.users.infrastructure.rest.request.UserListQueryParams
import cz.vokounova.configurator.users.infrastructure.rest.validation.UserChangePasswordParamsValidator
import cz.vokounova.configurator.users.infrastructure.rest.validation.UserCreateParamsValidator
import cz.vokounova.configurator.users.infrastructure.rest.validation.UserJsonPatchParamsValidator
import cz.vokounova.configurator.users.infrastructure.rest.validation.UserListQueryParamsValidator
import cz.vokounova.configurator.users.infrastructure.rest.validation.UserMeChangePasswordParamsValidator
import cz.vokounova.configurator.users.ports.inbound.UserAPI
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component
import java.util.UUID

@Component
class UsersController(
    private val userAPI: UserAPI,
    private val queryParamsValidator: UserListQueryParamsValidator,
    private val createParamsValidator: UserCreateParamsValidator,
    private val jsonPatchValidator: UserJsonPatchParamsValidator,
    private val changePasswordValidator: UserChangePasswordParamsValidator,
    private val meChangePasswordValidator: UserMeChangePasswordParamsValidator,
) {
    fun usersCreate(userCreateRequestDto: UserCreateRequestDto): ResponseEntity<UserDto> {
        val params = userCreateRequestDto.toParams()
        createParamsValidator.validate(params).throwIfNotEmpty()
        val user = userAPI.create(params)

        return ResponseEntity.status(HttpStatus.CREATED).body(user.toDto())
    }

    fun usersDelete(userId: UUID): ResponseEntity<Unit> {
        userAPI.delete(UserId(userId))
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build()
    }

    fun usersGet(userId: UUID): ResponseEntity<UserDto> {
        val user = userAPI.getOne(UserId(userId))
        return ResponseEntity.status(HttpStatus.OK).body(user.toDto())
    }

    fun usersPaginatedList(
        limit: Int?,
        after: String?,
        before: String?,
        orderBy: List<String>?,
        ids: List<UUID>?,
    ): ResponseEntity<UserPaginatedResponseDto> {
        val queryParamsDto =
            UserListQueryParams(
                limit = limit,
                orderBy = orderBy,
                ids = ids,
            )

        queryParamsValidator.validate(queryParamsDto).throwIfNotEmpty()

        val sortableFields =
            SortingUtils.createSorting<UserSortableField>(
                orderBy,
                UserSortingConfig,
            )

        val paginatedRequest =
            PaginationUtils.createPaginationRequest(
                limit = limit,
                orderBy = sortableFields,
                after = after,
                before = before,
            )

        val response = userAPI.getByFilterPaginated(queryParamsDto.toFilter(), paginatedRequest)
        return ResponseEntity.ok().body(
            UserPaginatedResponseDto(
                items = response.data.map { it.toDto() },
                pageMetadata =
                    PaginatedResponseMetaDto(
                        pagesTotal = response.pagesTotal,
                        nextPageAfter = response.cursorAfter?.value,
                        prevPageBefore = response.cursorBefore?.value,
                    ),
            ),
        )
    }

    fun usersPatch(
        userId: UUID,
        userPatchRequestDto: List<UserPatchRequestDto>,
    ): ResponseEntity<UserDto> {
        val params = userPatchRequestDto.map { it.toParams() }
        jsonPatchValidator.validate(params).throwIfNotEmpty()

        val user = userAPI.patch(UserId(userId), params)

        return ResponseEntity.status(HttpStatus.OK).body(user.toDto())
    }

    fun usersChangePassword(
        userId: UUID,
        userChangePasswordRequestDto: UserChangePasswordRequestDto,
    ): ResponseEntity<Unit> {
        val params = userChangePasswordRequestDto.toParams()
        changePasswordValidator.validate(params).throwIfNotEmpty()

        userAPI.changePassword(UserId(userId), params)
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build()
    }

    fun usersMeChangePassword(userMeChangePasswordRequestDto: UserMeChangePasswordRequestDto): ResponseEntity<Unit> {
        val currentUser = userAPI.getCurrentUser()

        val params =
            userMeChangePasswordRequestDto
                .toParams()
                .copy(encodedOldPassword = currentUser.password)

        meChangePasswordValidator.validate(params).throwIfNotEmpty()

        userAPI.changePassword(params)
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build()
    }
}

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
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/users/api/v1")
class UsersController(
    private val userAPI: UserAPI,
    private val queryParamsValidator: UserListQueryParamsValidator,
    private val createParamsValidator: UserCreateParamsValidator,
    private val jsonPatchValidator: UserJsonPatchParamsValidator,
    private val changePasswordValidator: UserChangePasswordParamsValidator,
    private val meChangePasswordValidator: UserMeChangePasswordParamsValidator,
) {
    @PostMapping("/users")
    fun usersCreate(
        @RequestBody userCreateRequestDto: UserCreateRequestDto,
    ): ResponseEntity<UserDto> {
        val params = userCreateRequestDto.toParams()
        createParamsValidator.validate(params).throwIfNotEmpty()
        val user = userAPI.create(params)

        return ResponseEntity.status(HttpStatus.CREATED).body(user.toDto())
    }

    @DeleteMapping("/users/{userId}")
    fun usersDelete(
        @PathVariable userId: UUID,
    ): ResponseEntity<Unit> {
        userAPI.delete(UserId(userId))
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build()
    }

    @GetMapping("/users/{userId}")
    fun usersGet(
        @PathVariable userId: UUID,
    ): ResponseEntity<UserDto> {
        val user = userAPI.getOne(UserId(userId))
        return ResponseEntity.status(HttpStatus.OK).body(user.toDto())
    }

    @GetMapping("/users/me")
    fun usersMe(): ResponseEntity<UserDto> {
        val currentUser = userAPI.getCurrentUser()

        return ResponseEntity
            .status(HttpStatus.OK)
            .body(
                UserDto(
                    id = currentUser.id.value,
                    firstName = currentUser.firstName,
                    surname = currentUser.surname,
                    email = currentUser.email,
                    createdAt = currentUser.createdAt,
                    modifiedAt = currentUser.modifiedAt,
                ),
            )
    }

    @GetMapping("/users")
    fun usersPaginatedList(
        @RequestParam(required = false) limit: Int?,
        @RequestParam(required = false) after: String?,
        @RequestParam(required = false) before: String?,
        @RequestParam(required = false) orderBy: List<String>?,
        @RequestParam(required = false) ids: List<UUID>?,
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

    @PatchMapping("/users/{userId}")
    fun usersPatch(
        @PathVariable userId: UUID,
        @RequestBody userPatchRequestDto: List<UserPatchRequestDto>,
    ): ResponseEntity<UserDto> {
        val params = userPatchRequestDto.map { it.toParams() }
        jsonPatchValidator.validate(params).throwIfNotEmpty()

        val user = userAPI.patch(UserId(userId), params)

        return ResponseEntity.status(HttpStatus.OK).body(user.toDto())
    }

    @PutMapping("/users/{userId}/password")
    fun usersChangePassword(
        @PathVariable userId: UUID,
        @RequestBody userChangePasswordRequestDto: UserChangePasswordRequestDto,
    ): ResponseEntity<Unit> {
        val params = userChangePasswordRequestDto.toParams()
        changePasswordValidator.validate(params).throwIfNotEmpty()

        userAPI.changePassword(UserId(userId), params)
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build()
    }

    @PutMapping("/users/me/password")
    fun usersMeChangePassword(
        @RequestBody userMeChangePasswordRequestDto: UserMeChangePasswordRequestDto,
    ): ResponseEntity<Unit> {
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

package cz.vokounova.configurator.users.infrastructure.rest.mapper

import cz.vokounova.configurator.shared.rest.jsonpatch.JsonPatchOperation
import cz.vokounova.configurator.users.domain.*
import cz.vokounova.configurator.users.infrastructure.rest.mapper.request.UserChangePasswordRequestDto
import cz.vokounova.configurator.users.infrastructure.rest.mapper.request.UserCreateRequestDto
import cz.vokounova.configurator.users.infrastructure.rest.mapper.request.UserMeChangePasswordRequestDto
import cz.vokounova.configurator.users.infrastructure.rest.mapper.request.UserPatchRequestDto
import cz.vokounova.configurator.users.infrastructure.rest.request.UserListQueryParams

fun UserCreateRequestDto.toParams(): UserCreateParams =
    UserCreateParams(
        firstName = firstName,
        surname = surname,
        email = email,
        password = password,
        confirmPassword = confirmPassword,
    )

fun UserPatchRequestDto.toParams(): UserJsonPatchParams =
    UserJsonPatchParams(
        path =
            when (path) {
                UserPatchRequestDto.Path.SlashFirstName -> UserJsonPatchParamsPath.FIRST_NAME
                UserPatchRequestDto.Path.SlashSurname -> UserJsonPatchParamsPath.SURNAME
                UserPatchRequestDto.Path.SlashIsActive -> UserJsonPatchParamsPath.IS_ACTIVE
                UserPatchRequestDto.Path.SlashEmail -> UserJsonPatchParamsPath.EMAIL
            },
        value = value,
        op =
            when (op) {
                UserPatchRequestDto.Op.Replace -> JsonPatchOperation.REPLACE
            },
    )

fun UserChangePasswordRequestDto.toParams(): UserChangePasswordParams =
    UserChangePasswordParams(
        newPassword = newPassword,
        confirmNewPassword = confirmNewPassword,
    )

fun UserMeChangePasswordRequestDto.toParams(): UserMeChangePasswordParams =
    UserMeChangePasswordParams(
        oldPassword = oldPassword,
        encodedOldPassword = null,
        newPassword = newPassword,
        confirmNewPassword = confirmNewPassword,
    )

fun UserListQueryParams.toFilter(): UserFilter =
    UserFilter(
        ids = ids?.map { UserId(it) },
        search = search,
    )

package cz.vokounova.configurator.users.domain

import com.fasterxml.jackson.annotation.JsonValue
import cz.vokounova.configurator.shared.rest.jsonpatch.JsonPatchOperation
import cz.vokounova.configurator.shared.rest.jsonpatch.JsonPatchParams

data class UserCreateParams(
    val firstName: String,
    val surname: String,
    val email: String,
    val name: String,
    val password: String,
    val confirmPassword: String,
)

data class UserJsonPatchParams(
    override val path: UserJsonPatchParamsPath,
    override val value: Any?,
    override val op: JsonPatchOperation,
) : JsonPatchParams<UserJsonPatchParamsPath>(path, value, op)

enum class UserJsonPatchParamsPath(
    val value: String,
) {
    FIRST_NAME("/firstName"),
    SURNAME("/surname"),
    EMAIL("/email"),
    IS_ACTIVE("/isActive"),
    ;

    @JsonValue
    fun getEnumValue(): String = value
}

data class UserChangePasswordParams(
    val newPassword: String,
    val confirmNewPassword: String,
)

data class UserMeChangePasswordParams(
    val oldPassword: String,
    val encodedOldPassword: String?,
    val newPassword: String,
    val confirmNewPassword: String,
)

package cz.vokounova.configurator.users.application.exception

import cz.vokounova.configurator.shared.exceptions.ApplicationException

class UserException(
    code: UserErrorCode,
    message: String = code.message,
    cause: Throwable? = null,
) : ApplicationException(
        code = code.name,
        message = message,
        cause = cause,
    )

enum class UserErrorCode(
    val message: String,
) {
    CREATE_USER_FAILED("Create user failed"),
    UPDATE_USER_FAILED("Update user failed"),
}

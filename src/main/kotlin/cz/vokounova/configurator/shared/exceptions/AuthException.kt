package cz.vokounova.configurator.shared.exceptions

class AuthException(
    code: AuthErrorCode,
    message: String = code.message,
    cause: Throwable? = null,
) : ApplicationException(
        code = code.name,
        message = message,
        cause = cause,
    )

enum class AuthErrorCode(
    val message: String,
) {
    UNAUTHORIZED("Unauthorized"),
    FORBIDDEN("Forbidden"),
    DEACTIVATED("Deactivated"),
    INVALID_TOKEN("Invalid token"),
    INVALID_REFRESH_TOKEN("Invalid refresh token"),
    EXPIRED_REFRESH_TOKEN("Expired refresh token"),
    INVALID_CREDENTIALS("Invalid credentials"),
}

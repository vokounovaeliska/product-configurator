package cz.vokounova.configurator.shared.exceptions

class PaginationException(
    code: PaginationErrorCode,
    message: String = code.message,
    cause: Throwable? = null,
) : ApplicationException(
        code = code.name,
        message = message,
        cause = cause,
    )

enum class PaginationErrorCode(
    val message: String,
) {
    INVALID_FIELDS("Fields defined in order by and cursor do not match"),
    MISSING_CURSOR_VALUE("Missing cursor value"),
}

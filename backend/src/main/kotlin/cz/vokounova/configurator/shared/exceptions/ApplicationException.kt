package cz.vokounova.configurator.shared.exceptions

abstract class ApplicationException(
    var code: String,
    message: String,
    cause: Throwable? = null,
) : RuntimeException(message, cause)

enum class CommonErrorCode {
    RESOURCE_NOT_FOUND,
    INTERNAL_SERVER_ERROR,
    UNEXPECTED_ERROR,
    UNSUPPORTED_LANGUAGE_ERROR,
    VALIDATION_ERROR,
    RESOURCE_CANNOT_BE_DEACTIVATED,
    RESOURCE_CANNOT_BE_DELETED,
    RESOURCE_CANNOT_BE_UPSERTED,
    DUPLICATE_OPTION_RULE,
}

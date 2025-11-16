package cz.vokounova.configurator.shared.exceptions

data class ValidationException(
    var code: String,
    val errors: List<ValidationExceptionError> = listOf(),
    override val cause: Throwable? = null,
) : RuntimeException("Validation exception", cause)

data class ValidationExceptionError(
    val field: String,
    val code: String,
    val message: String,
    val constraint: String? = null,
)

fun List<ValidationExceptionError>.throwIfNotEmpty(): Unit =
    if (isNotEmpty()) {
        throw ValidationException(
            code = CommonErrorCode.VALIDATION_ERROR.name,
            errors = this,
        )
    } else {
    }

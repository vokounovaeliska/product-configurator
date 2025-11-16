package cz.vokounova.configurator.shared.rest.response

import cz.vokounova.configurator.shared.exceptions.CommonErrorCode

class ValidationErrorResponse(
    val errors: List<ValidationError>,
) {
    constructor(code: String, message: String?, field: String? = null, constraint: String? = null) : this(
        mutableListOf(
            ValidationError(
                code = code,
                message = message,
                field = field,
                constraint = constraint,
            ),
        ),
    )

    constructor(exception: Exception, field: String? = null) : this(
        mutableListOf(
            ValidationError(
                code = CommonErrorCode.VALIDATION_ERROR.name,
                message = exception.message,
                field = field,
            ),
        ),
    )
}

data class ValidationError(
    val code: String? = CommonErrorCode.VALIDATION_ERROR.name,
    val message: String? = "Invalid input",
    val field: String? = null,
    val constraint: String? = null,
)

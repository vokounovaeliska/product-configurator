package cz.vokounova.configurator.shared.rest.response

import cz.vokounova.configurator.shared.exceptions.ApplicationException
import cz.vokounova.configurator.shared.exceptions.CommonErrorCode

class ApplicationErrorResponse(
    val errors: List<ApplicationError>,
) {
    constructor(code: CommonErrorCode, message: String?) : this(
        mutableListOf(
            ApplicationError(
                code = code.name,
                message = message,
            ),
        ),
    )

    constructor(exception: ApplicationException) : this(
        mutableListOf(
            ApplicationError(
                code = exception.code,
                message = exception.message,
            ),
        ),
    )

    constructor(exception: Throwable) : this(
        mutableListOf(
            ApplicationError(
                code = CommonErrorCode.INTERNAL_SERVER_ERROR.name,
                message = exception.message ?: exception.javaClass.simpleName,
            ),
        ),
    )
}

data class ApplicationError(
    val code: String? = CommonErrorCode.UNEXPECTED_ERROR.name,
    val message: String?,
)

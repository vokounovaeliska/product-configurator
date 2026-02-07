package cz.vokounova.configurator.products.attributes.infrastructure.rest

import cz.vokounova.configurator.products.attributes.application.exception.AttributeErrorCode
import cz.vokounova.configurator.products.attributes.application.exception.AttributeException
import cz.vokounova.configurator.shared.rest.response.ApplicationErrorResponse
import cz.vokounova.configurator.shared.rest.response.ValidationError
import cz.vokounova.configurator.shared.rest.response.ValidationErrorResponse
import cz.vokounova.configurator.shared.utils.logger
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler

@ControllerAdvice
@Order(Ordered.LOWEST_PRECEDENCE - 1)
class AttributeExceptionHandler {
    companion object {
        val LOGGER by logger()
    }

    @ExceptionHandler(AttributeException::class)
    fun handleAttributeException(ex: AttributeException): ResponseEntity<*> {
        val validationErrorCodes =
            setOf(
                AttributeErrorCode.INVALID_ATTRIBUTE_TYPE_CONFIGURATION,
                AttributeErrorCode.ENUM_ATTRIBUTE_REQUIRES_OPTIONS,
                AttributeErrorCode.INTEGER_RANGE_INVALID,
                AttributeErrorCode.DECIMAL_RANGE_INVALID,
            )

        return if (validationErrorCodes.any { it.name == ex.code }) {
            LOGGER.error("Attribute validation exception occurred", ex)
            ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(
                    ValidationErrorResponse(
                        errors =
                            listOf(
                                ValidationError(
                                    code = ex.code,
                                    message = ex.message,
                                ),
                            ),
                    ),
                )
        } else {
            LOGGER.error("Attribute exception occurred", ex)
            ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApplicationErrorResponse(ex))
        }
    }
}

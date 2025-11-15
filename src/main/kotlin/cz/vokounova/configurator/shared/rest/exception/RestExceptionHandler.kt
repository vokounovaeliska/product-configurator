package cz.vokounova.configurator.shared.rest.exception

import com.fasterxml.jackson.core.JsonParseException
import com.fasterxml.jackson.databind.JsonMappingException
import com.fasterxml.jackson.databind.exc.MismatchedInputException
import cz.vokounova.configurator.shared.exceptions.ApplicationException
import cz.vokounova.configurator.shared.exceptions.AuthException
import cz.vokounova.configurator.shared.exceptions.CannotBeDeactivatedException
import cz.vokounova.configurator.shared.exceptions.CannotBeDeletedException
import cz.vokounova.configurator.shared.exceptions.CommonErrorCode
import cz.vokounova.configurator.shared.exceptions.InvalidJsonPatchException
import cz.vokounova.configurator.shared.exceptions.LanguageNotSupportedException
import cz.vokounova.configurator.shared.exceptions.PaginationException
import cz.vokounova.configurator.shared.exceptions.ResourceNotFoundException
import cz.vokounova.configurator.shared.exceptions.ValidationException
import cz.vokounova.configurator.shared.rest.response.ApplicationErrorResponse
import cz.vokounova.configurator.shared.rest.response.ValidationError
import cz.vokounova.configurator.shared.rest.response.ValidationErrorResponse
import cz.vokounova.configurator.shared.utils.logger
import cz.vokounova.configurator.shared.validations.validationAnnotationToCodeMap
import jakarta.validation.ConstraintViolationException
import org.postgresql.util.PSQLException
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.security.authorization.AuthorizationDeniedException
import org.springframework.web.HttpMediaTypeNotAcceptableException
import org.springframework.web.HttpMediaTypeNotSupportedException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.MissingServletRequestParameterException
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException
import org.springframework.web.multipart.support.MissingServletRequestPartException
import org.springframework.web.servlet.resource.NoResourceFoundException

@ControllerAdvice
@Order(Ordered.LOWEST_PRECEDENCE)
class RestExceptionHandler(
    private val psqlExceptionConverter: PsqlExceptionConverter,
) {
    companion object {
        val LOGGER by logger()
    }

    @ExceptionHandler(AuthException::class)
    fun handleAuthException(ex: AuthException): ResponseEntity<ApplicationErrorResponse> {
        LOGGER.error("Authentication exception occurred", ex)
        return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(ApplicationErrorResponse(ex))
    }

    @ExceptionHandler(AuthorizationDeniedException::class)
    fun handleAuthorizationDeniedException(ex: AuthorizationDeniedException): ResponseEntity<ApplicationErrorResponse> {
        LOGGER.error("Authorization denied exception occurred", ex)
        return ResponseEntity
            .status(HttpStatus.FORBIDDEN)
            .body(ApplicationErrorResponse(ex))
    }

    @ExceptionHandler(NoResourceFoundException::class)
    fun handleNoResourceFoundException(ex: NoResourceFoundException): ResponseEntity<ApplicationErrorResponse> {
        LOGGER.error("Resource not found exception occurred", ex)
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(ApplicationErrorResponse(code = CommonErrorCode.RESOURCE_NOT_FOUND, message = ex.message))
    }

    @ExceptionHandler(ResourceNotFoundException::class)
    fun handleResourceNotFoundException(ex: ResourceNotFoundException): ResponseEntity<ApplicationErrorResponse> {
        LOGGER.error("Resource not found exception occurred", ex)
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(ApplicationErrorResponse(ex))
    }

    @ExceptionHandler(JsonMappingException::class)
    fun handleJsonMappingException(ex: JsonMappingException): ResponseEntity<ValidationErrorResponse> {
        LOGGER.error("Json mapping exception", ex)

        val errors = JsonExceptionConverter.toValidationError(ex)

        return if (errors.isNotEmpty()) {
            ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ValidationErrorResponse(errors))
        } else {
            ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ValidationErrorResponse(ex))
        }
    }

    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleHttpMessageNotReadableException(ex: HttpMessageNotReadableException): ResponseEntity<ValidationErrorResponse> {
        LOGGER.error("HTTP message not readable exception occurred", ex)
        return when (val cause = ex.cause) {
            is JsonMappingException -> {
                handleJsonMappingException(cause)
            }

            else -> {
                ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ValidationErrorResponse(code = CommonErrorCode.VALIDATION_ERROR.name, message = ex.message))
            }
        }
    }

    @ExceptionHandler(MismatchedInputException::class)
    fun handleMismatchedInputException(ex: MismatchedInputException): ResponseEntity<ValidationErrorResponse> {
        LOGGER.error("Mismatched input exception occurred", ex)
        val errors =
            ex.path?.map { pathRef ->
                ValidationError(
                    field = pathRef.fieldName,
                    message = "Cannot deserialize json value for field: ${pathRef.fieldName}",
                )
            }

        val response = if (errors.isNullOrEmpty()) ValidationErrorResponse(ex) else ValidationErrorResponse(errors)

        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(response)
    }

    @ExceptionHandler(ValidationException::class)
    fun handleValidationException(ex: ValidationException): ResponseEntity<ValidationErrorResponse> {
        LOGGER.error("Validation exception occurred", ex)
        val errors =
            ex.errors
                .map { error ->
                    ValidationError(
                        code = error.code,
                        message = error.message,
                        field = error.field,
                        constraint = error.constraint,
                    )
                }.ifEmpty {
                    listOf(ValidationError(code = ex.code))
                }

        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ValidationErrorResponse(errors))
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleMethodArgumentNotValidException(ex: MethodArgumentNotValidException): ResponseEntity<ValidationErrorResponse> {
        LOGGER.error("Method argument not valid exception occurred", ex)
        val errors =
            ex.bindingResult.fieldErrors.map { error ->
                val message =
                    error.defaultMessage?.replaceFirstChar { it.titlecase() }
                ValidationError(
                    code = validationAnnotationToCodeMap[error.code],
                    message = message,
                    field = error.field,
                )
            }

        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ValidationErrorResponse(errors))
    }

    @ExceptionHandler(CannotBeDeletedException::class)
    fun handleCannotBeDeletedException(ex: CannotBeDeletedException): ResponseEntity<ApplicationErrorResponse> {
        LOGGER.error("Resource cannot be deleted exception occurred", ex)
        return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(ApplicationErrorResponse(CommonErrorCode.RESOURCE_CANNOT_BE_DELETED, ex.message))
    }

    @ExceptionHandler(CannotBeDeactivatedException::class)
    fun handleCannotBeDeactivatedException(ex: CannotBeDeactivatedException): ResponseEntity<ApplicationErrorResponse> {
        LOGGER.error("Resource cannot be deactivated exception occurred", ex)
        return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(ApplicationErrorResponse(CommonErrorCode.RESOURCE_CANNOT_BE_DEACTIVATED, ex.message))
    }

    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArgumentException(ex: IllegalArgumentException): ResponseEntity<ValidationErrorResponse> {
        LOGGER.error("Illegal argument exception occurred", ex)
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ValidationErrorResponse(ex))
    }

    @ExceptionHandler(InvalidJsonPatchException::class)
    fun handleInvalidJsonPatchException(ex: InvalidJsonPatchException): ResponseEntity<ValidationErrorResponse> {
        LOGGER.error("Invalid JSON Patch exception occurred", ex)
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ValidationErrorResponse(ex))
    }

    @ExceptionHandler(MissingServletRequestParameterException::class)
    fun handleMissingServletRequestParameterException(
        ex: MissingServletRequestParameterException,
    ): ResponseEntity<ValidationErrorResponse> {
        LOGGER.error("Missing request parameter", ex)
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ValidationErrorResponse(ex))
    }

    @ExceptionHandler(IllegalStateException::class)
    fun handleIllegalStateException(ex: IllegalStateException): ResponseEntity<ValidationErrorResponse> {
        LOGGER.error("Illegal state exception occurred", ex)
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ValidationErrorResponse(ex))
    }

    @ExceptionHandler(LanguageNotSupportedException::class)
    fun handleLanguageNotSupportedException(ex: LanguageNotSupportedException): ResponseEntity<ValidationErrorResponse> {
        LOGGER.error("Language not supported exception occurred", ex)
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ValidationErrorResponse(ex, "languageCode"))
    }

    @ExceptionHandler(JsonParseException::class)
    fun handleJsonParseException(ex: JsonParseException): ResponseEntity<ValidationErrorResponse> {
        LOGGER.error("Json parse exception occurred", ex)
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ValidationErrorResponse(ex))
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException::class)
    fun handleMethodArgumentTypeMismatchException(ex: MethodArgumentTypeMismatchException): ResponseEntity<ValidationErrorResponse> {
        LOGGER.error("Method argument type mismatch exception occurred", ex)
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(
                ValidationErrorResponse(
                    CommonErrorCode.VALIDATION_ERROR.name,
                    "Failed to convert value because provided value is invalid.",
                    ex.propertyName,
                ),
            )
    }

    @ExceptionHandler(DataIntegrityViolationException::class)
    fun handleDataIntegrityViolationException(ex: DataIntegrityViolationException): ResponseEntity<ValidationErrorResponse> {
        LOGGER.error("Data integrity violation exception occurred", ex)
        val cause = ex.cause

        return if (cause is PSQLException) {
            val validationError = PsqlExceptionConverter.toValidationError(cause)

            ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ValidationErrorResponse(listOf(validationError)))
        } else {
            ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ValidationErrorResponse(ex))
        }
    }

    @ExceptionHandler(PaginationException::class)
    fun handlePaginationException(ex: PaginationException): ResponseEntity<ValidationErrorResponse> {
        LOGGER.error("Pagination exception occurred", ex)
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ValidationErrorResponse(ex))
    }

    @ExceptionHandler(MissingServletRequestPartException::class)
    fun handleMissingServletRequestPartException(ex: MissingServletRequestPartException): ResponseEntity<ValidationErrorResponse> {
        LOGGER.error("Missing servlet request part exception occurred", ex)
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ValidationErrorResponse(ex))
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException::class)
    fun handleHttpMediaTypeNotSupportedException(ex: HttpMediaTypeNotSupportedException): ResponseEntity<ApplicationErrorResponse> {
        LOGGER.error("HTTP media type not supported exception occurred", ex)
        return ResponseEntity
            .status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
            .body(ApplicationErrorResponse(CommonErrorCode.VALIDATION_ERROR, ex.message))
    }

    @ExceptionHandler(HttpMediaTypeNotAcceptableException::class)
    fun handleHttpMediaTypeNotAcceptableException(ex: HttpMediaTypeNotAcceptableException): ResponseEntity<ApplicationErrorResponse> {
        LOGGER.error("HTTP media type not acceptable exception occurred", ex)
        return ResponseEntity
            .status(HttpStatus.NOT_ACCEPTABLE)
            .body(ApplicationErrorResponse(CommonErrorCode.VALIDATION_ERROR, ex.message))
    }

    @ExceptionHandler(ConstraintViolationException::class)
    fun handleConstraintViolationExceptions(ex: ConstraintViolationException): ResponseEntity<ValidationErrorResponse> {
        LOGGER.error("Constraint violation exception occurred", ex)
        val errors =
            ex.constraintViolations.map { violation ->
                val propertyPath = violation.propertyPath.toString()
                val property =
                    if (propertyPath.contains(".")) {
                        propertyPath.split(".").last()
                    } else {
                        propertyPath
                    }

                val message = violation.message?.replaceFirstChar { it.titlecase() }

                ValidationError(
                    code = CommonErrorCode.VALIDATION_ERROR.name,
                    message = message,
                    field = property,
                )
            }

        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ValidationErrorResponse(errors))
    }

    @ExceptionHandler(ApplicationException::class)
    fun handleApplicationException(ex: ApplicationException): ResponseEntity<ApplicationErrorResponse> {
        LOGGER.error("Application exception occurred", ex)
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApplicationErrorResponse(ex))
    }

    @ExceptionHandler(Throwable::class)
    fun handleException(ex: Throwable): ResponseEntity<ApplicationErrorResponse> {
        LOGGER.error("Unexpected exception occurred", ex)
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApplicationErrorResponse(ex))
    }
}

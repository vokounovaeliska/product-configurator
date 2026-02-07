package cz.vokounova.configurator.shared.validations

import cz.vokounova.configurator.shared.exceptions.ValidationExceptionError

/**
 * Application validator
 *
 * Base class for any app validations
 *
 */
interface AppValidator<T> {
    /**
     * Validates [value] of specific [T]
     * @return list of [ValidationExceptionError]
     */
    fun validate(value: T): List<ValidationExceptionError>

    /**
     * Validates list of [value] of specific [T]
     * @return list of [ValidationExceptionError]
     */
    fun validate(value: List<T>): List<ValidationExceptionError> = value.map { validate(it) }.flatten()

    fun validation(init: ValidationContext.() -> Unit): List<ValidationExceptionError> {
        val ctx = ValidationContext()
        ctx.init()
        return ctx.getErrors()
    }

    fun ValidationExceptionError(
        field: String,
        message: String,
    ): ValidationExceptionError =
        ValidationExceptionError(
            field = field,
            code = BaseValidationCode.VALUE_IS_INVALID.name,
            message = message,
        )
}

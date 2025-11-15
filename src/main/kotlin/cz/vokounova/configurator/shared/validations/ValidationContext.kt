package cz.vokounova.configurator.shared.validations

import cz.vokounova.configurator.shared.exceptions.ValidationExceptionError
import cz.vokounova.configurator.shared.validations.validators.AnyFieldValidator
import cz.vokounova.configurator.shared.validations.validators.BooleanFieldValidator
import cz.vokounova.configurator.shared.validations.validators.ByteArrayFieldValidator
import cz.vokounova.configurator.shared.validations.validators.CollectionFieldValidator
import cz.vokounova.configurator.shared.validations.validators.MapFieldValidator
import cz.vokounova.configurator.shared.validations.validators.NumberFieldValidator
import cz.vokounova.configurator.shared.validations.validators.StringFieldValidator

/**
 * Validation context holds collection of errors for single validation
 * @return list of [ValidationExceptionError]
 */
class ValidationContext {
    private val validationErrors = mutableListOf<ValidationExceptionError>()

    fun getErrors(): List<ValidationExceptionError> = validationErrors

    fun addError(error: ValidationExceptionError) = validationErrors.add(error)

    fun addErrors(errors: List<ValidationExceptionError>) = validationErrors.addAll(errors)

    private fun <T> FieldValidator<T>.collectErrors() =
        this.getConstraints().map { constraint ->
            if (constraint.test(this.value)) {
                validationErrors.add(
                    ValidationExceptionError(
                        code = constraint.code,
                        message = constraint.message,
                        field = constraint.field,
                        constraint = constraint.constraintValue.toString(),
                    ),
                )
            }
        }

    fun field(
        field: String,
        value: Map<*, *>?,
        init: MapFieldValidator.() -> Unit,
    ): MapFieldValidator {
        val validator = MapFieldValidator(field, value)
        validator.init()
        validator.collectErrors()
        return validator
    }

    fun field(
        field: String,
        value: Collection<*>?,
        init: CollectionFieldValidator.() -> Unit,
    ): CollectionFieldValidator {
        val validator = CollectionFieldValidator(field, value)
        validator.init()
        validator.collectErrors()
        return validator
    }

    fun field(
        field: String,
        value: ByteArray?,
        init: ByteArrayFieldValidator.() -> Unit,
    ): ByteArrayFieldValidator {
        val validator = ByteArrayFieldValidator(field, value)
        validator.init()
        validator.collectErrors()
        return validator
    }

    fun field(
        field: String,
        value: String?,
        init: StringFieldValidator.() -> Unit,
    ): StringFieldValidator {
        val validator = StringFieldValidator(field, value)
        validator.init()
        validator.collectErrors()
        return validator
    }

    fun field(
        field: String,
        value: Boolean?,
        init: BooleanFieldValidator.() -> Unit,
    ): BooleanFieldValidator {
        val validator = BooleanFieldValidator(field, value)
        validator.init()
        validator.collectErrors()
        return validator
    }

    fun anyField(
        field: String,
        value: Any?,
        init: AnyFieldValidator.() -> Unit,
    ): AnyFieldValidator {
        val validator = AnyFieldValidator(field, value)
        validator.init()
        validator.collectErrors()
        return validator
    }

    fun field(
        field: String,
        value: Number?,
        init: NumberFieldValidator.() -> Unit,
    ): NumberFieldValidator {
        val validator = NumberFieldValidator(field, value)
        validator.init()
        validator.collectErrors()
        return validator
    }
}

package cz.vokounova.configurator.shared.validations.validators

import cz.vokounova.configurator.shared.pagination.SortingConfig
import cz.vokounova.configurator.shared.pagination.SortingUtils.SORT_ORDER_PREFIX
import cz.vokounova.configurator.shared.utils.tryOrNull
import cz.vokounova.configurator.shared.validations.BaseValidationCode
import cz.vokounova.configurator.shared.validations.FieldValidator
import cz.vokounova.configurator.shared.validations.ValidationConstants.MIN_SEARCH_TEXT_LENGTH
import cz.vokounova.configurator.shared.validations.ValidationConstants.MIN_SEARCH_TEXT_WITH_NUMBER_LENGTH
import java.util.UUID

data class StringFieldValidator(
    override val field: String,
    override val value: String?,
) : FieldValidator<Any>() {
    fun notNull() {
        addConstraint(
            "Cannot be null",
            BaseValidationCode.FIELD_IS_NULL,
        ) {
            value == null
        }
    }

    fun notEmpty() {
        value?.let { str ->
            addConstraint(
                "Cannot be empty",
                BaseValidationCode.FIELD_IS_EMPTY,
            ) {
                str.trim().isEmpty()
            }
        }
    }

    fun validOrderBy(config: SortingConfig<*>) {
        value?.let {
            val orderBy = tryOrNull { config.getValue(it.removePrefix(SORT_ORDER_PREFIX)) }

            addConstraint(
                "Provided value is invalid",
                BaseValidationCode.VALUE_BAD_FORMAT,
            ) {
                orderBy == null
            }
        }
    }

    fun validUUID() {
        value?.let {
            val uuid = tryOrNull { UUID.fromString(it) }

            addConstraint(
                "Is not valid UUID",
                BaseValidationCode.VALUE_BAD_FORMAT,
            ) {
                uuid == null
            }
        }
    }

    fun isOneOf(vararg options: String) {
        value?.let {
            val normalizedValue = it.trim().lowercase()
            addConstraint(
                "Provided value should be one of: ${options.contentToString()}",
                BaseValidationCode.VALUE_BAD_FORMAT,
            ) {
                !options.any { option -> option.equals(normalizedValue, ignoreCase = true) }
            }
        }
    }

    fun isOneOf(options: List<String>) = isOneOf(*options.toTypedArray())

    fun validSearchableNumber(
        minTextLength: Int = MIN_SEARCH_TEXT_LENGTH,
        minTextWithNumberLength: Int = MIN_SEARCH_TEXT_WITH_NUMBER_LENGTH,
    ) {
        value?.let {
            val double = value.toDoubleOrNull()
            val minLength = if (double != null) minTextWithNumberLength else minTextLength

            addConstraint(
                "Value is shorter than $minLength",
                BaseValidationCode.VALUE_TOO_SMALL,
                minLength,
            ) {
                value.trim().length < minLength
            }
        }
    }

    fun minLength(min: Int = MIN_SEARCH_TEXT_LENGTH) {
        value?.let {
            addConstraint(
                "Value is shorter than $min",
                BaseValidationCode.VALUE_TOO_SMALL,
                min,
            ) {
                value.trim().length < min
            }
        }
    }

    fun maxLength(max: Int) {
        value?.let {
            addConstraint(
                "Value is longer than $max",
                BaseValidationCode.VALUE_TOO_LARGE,
                max,
            ) {
                value.trim().length > max
            }
        }
    }

    fun matchPattern(pattern: String) {
        value?.let {
            addConstraint(
                "Value does not match pattern $pattern",
                BaseValidationCode.DOES_NOT_MATCH_PATTERN,
                pattern,
            ) {
                !value.matches(Regex(pattern))
            }
        }
    }

    fun matchField(
        fieldName: String,
        fieldValue: String,
        errorCode: String = BaseValidationCode.FIELDS_NOT_MATCH.name,
    ) {
        value?.let {
            addConstraint(
                "$field and $fieldName do not match",
                errorCode,
            ) {
                value != fieldValue
            }
        }
    }

    fun customValidation(
        errorMessage: String,
        errorCode: String,
        constraintValue: String? = null,
        errorTest: () -> Boolean,
    ) {
        value?.let {
            addConstraint(
                errorMessage,
                errorCode,
                constraintValue,
            ) {
                errorTest()
            }
        }
    }
}

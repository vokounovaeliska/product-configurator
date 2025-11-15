package cz.vokounova.configurator.shared.validations.validators

import cz.vokounova.configurator.shared.validations.BaseValidationCode
import cz.vokounova.configurator.shared.validations.FieldValidator

class NumberFieldValidator(
    override val field: String,
    override val value: Number?,
) : FieldValidator<Number?>() {
    fun notNull() {
        addConstraint(
            "Cannot be null",
            BaseValidationCode.FIELD_IS_NULL,
        ) {
            value == null
        }
    }

    fun min(min: Int) = min(min.toLong())

    fun min(min: Long) {
        value?.let {
            addConstraint(
                "Value is smaller than $min",
                BaseValidationCode.VALUE_TOO_SMALL,
            ) {
                value.toDouble() < min
            }
        }
    }

    fun min(min: Double) {
        value?.let {
            addConstraint(
                "Value is smaller than $min",
                BaseValidationCode.VALUE_TOO_SMALL,
            ) {
                value.toDouble() < min
            }
        }
    }

    fun max(max: Int) = max(max.toLong())

    fun max(max: Long) {
        value?.let {
            addConstraint(
                "Value is greater than $max",
                BaseValidationCode.VALUE_TOO_LARGE,
            ) {
                value.toDouble() > max
            }
        }
    }

    fun max(max: Double) {
        value?.let {
            addConstraint(
                "Value is greater than $max",
                BaseValidationCode.VALUE_TOO_LARGE,
            ) {
                value.toDouble() > max
            }
        }
    }

    fun range(
        min: Int,
        max: Int,
    ) = range(min.toLong(), max.toLong())

    fun range(
        min: Long,
        max: Long,
    ) {
        value?.let {
            addConstraint(
                "Value must be between $min and $max",
                BaseValidationCode.VALUE_IS_INVALID,
            ) {
                val doubleValue = value.toDouble()
                doubleValue < min || doubleValue > max
            }
        }
    }

    fun range(
        min: Double,
        max: Double,
    ) {
        value?.let {
            addConstraint(
                "Value must be between $min and $max",
                BaseValidationCode.VALUE_IS_INVALID,
            ) {
                val doubleValue = value.toDouble()
                doubleValue < min || doubleValue > max
            }
        }
    }
}

package cz.vokounova.configurator.shared.validations.validators

import cz.vokounova.configurator.shared.validations.BaseValidationCode
import cz.vokounova.configurator.shared.validations.FieldValidator

class MapFieldValidator(
    override val field: String,
    override val value: Map<*, *>?,
) : FieldValidator<Map<*, *>?>() {
    fun notNull() {
        addConstraint(
            "Cannot be null",
            BaseValidationCode.FIELD_IS_NULL,
        ) {
            value == null
        }
    }

    fun min(min: Double) {
        value?.let {
            anyToDouble(it["value"])?.let { doubleValue ->
                addConstraint(
                    "Value is smaller than $min",
                    BaseValidationCode.VALUE_TOO_SMALL,
                    min,
                ) {
                    doubleValue < min
                }
            }
        }
    }

    fun max(max: Double) {
        value?.let {
            anyToDouble(it["value"])?.let { doubleValue ->
                addConstraint(
                    "Value is greater than $max",
                    BaseValidationCode.VALUE_TOO_LARGE,
                    max,
                ) {
                    doubleValue > max
                }
            }
        }
    }
}

package cz.vokounova.configurator.shared.validations.validators

import cz.vokounova.configurator.shared.validations.BaseValidationCode
import cz.vokounova.configurator.shared.validations.FieldValidator

class ByteArrayFieldValidator(
    override val field: String,
    override val value: ByteArray?,
) : FieldValidator<ByteArray?>() {
    fun notNull() {
        addConstraint(
            "Cannot be null",
            BaseValidationCode.FIELD_IS_NULL,
        ) {
            value == null
        }
    }

    fun notEmpty() {
        value?.let { collection ->
            addConstraint(
                "Cannot be empty",
                BaseValidationCode.FIELD_IS_EMPTY,
            ) {
                collection.isEmpty()
            }
        }
    }
}

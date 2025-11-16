package cz.vokounova.configurator.shared.validations.validators

import cz.vokounova.configurator.shared.validations.BaseValidationCode
import cz.vokounova.configurator.shared.validations.FieldValidator

data class BooleanFieldValidator(
    override val field: String,
    override val value: Boolean?,
) : FieldValidator<Any>() {
    fun notNull() {
        addConstraint(
            "Cannot be null",
            BaseValidationCode.FIELD_IS_NULL,
        ) {
            value == null
        }
    }
}

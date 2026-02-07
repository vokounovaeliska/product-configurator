package cz.vokounova.configurator.products.attributes.infrastructure.rest.validation

import cz.vokounova.configurator.products.attributes.domain.AttributeJsonPatchParams
import cz.vokounova.configurator.products.attributes.domain.AttributeJsonPatchParamsPath
import cz.vokounova.configurator.shared.exceptions.ValidationExceptionError
import cz.vokounova.configurator.shared.validations.AppValidator
import cz.vokounova.configurator.shared.validations.BaseValidationCode
import org.springframework.stereotype.Component

@Component
class AttributeJsonPatchParamsValidator : AppValidator<AttributeJsonPatchParams> {
    override fun validate(value: AttributeJsonPatchParams): List<ValidationExceptionError> =
        validation {
            when (val path = value.path) {
                AttributeJsonPatchParamsPath.CODE -> {
                    field(path.value, value.value as? String) {
                        notNull()
                        notEmpty()
                    }
                }

                AttributeJsonPatchParamsPath.LABEL -> {
                    field(path.value, value.value as? String) {
                        notNull()
                        notEmpty()
                    }
                }

                AttributeJsonPatchParamsPath.TYPE -> {
                    anyField(path.value, value.value) {
                        notNull()
                    }
                }

                AttributeJsonPatchParamsPath.IS_REQUIRED -> {
                    field(path.value, value.value as? Boolean) {
                        notNull()
                    }
                }

                AttributeJsonPatchParamsPath.MIN_INT,
                AttributeJsonPatchParamsPath.MAX_INT,
                -> {
                    // Can be null or integer
                    value.value?.let {
                        if (it !is Number) {
                            addError(
                                ValidationExceptionError(
                                    field = path.value,
                                    code = BaseValidationCode.VALUE_IS_INVALID.name,
                                    message = "Value must be a number",
                                ),
                            )
                        }
                    }
                }

                AttributeJsonPatchParamsPath.MIN_DECIMAL,
                AttributeJsonPatchParamsPath.MAX_DECIMAL,
                -> {
                    // Can be null or decimal
                    value.value?.let {
                        if (it !is Number) {
                            addError(
                                ValidationExceptionError(
                                    field = path.value,
                                    code = BaseValidationCode.VALUE_IS_INVALID.name,
                                    message = "Value must be a number",
                                ),
                            )
                        }
                    }
                }

                AttributeJsonPatchParamsPath.UNIT -> {
                    // Unit can be null or non-empty string
                    (value.value as? String)?.let { unitStr ->
                        if (unitStr.isBlank()) {
                            addError(
                                ValidationExceptionError(
                                    field = path.value,
                                    code = BaseValidationCode.VALUE_IS_INVALID.name,
                                    message = "Unit must not be blank when provided",
                                ),
                            )
                        }
                    }
                }

                AttributeJsonPatchParamsPath.SORT_ORDER -> {
                    field(path.value, value.value as? Number) {
                        notNull()
                        min(0)
                    }
                }
            }
        }
}

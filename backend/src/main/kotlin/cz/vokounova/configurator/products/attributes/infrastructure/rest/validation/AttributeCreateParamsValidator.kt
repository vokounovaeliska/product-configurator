package cz.vokounova.configurator.products.attributes.infrastructure.rest.validation

import cz.vokounova.configurator.generated.jooq.enums.AttributeType
import cz.vokounova.configurator.products.attributes.domain.AttributeCreateParams
import cz.vokounova.configurator.shared.exceptions.ValidationExceptionError
import cz.vokounova.configurator.shared.validations.AppValidator
import cz.vokounova.configurator.shared.validations.BaseValidationCode
import org.springframework.stereotype.Component

@Component
class AttributeCreateParamsValidator : AppValidator<AttributeCreateParams> {
    override fun validate(value: AttributeCreateParams): List<ValidationExceptionError> =
        validation {
            field("code", value.code) {
                notNull()
                notEmpty()
            }
            field("label", value.label) {
                notNull()
                notEmpty()
            }
            anyField("type", value.type) {
                notNull()
            }
            value.sortOrder?.let { sortOrderValue ->
                field("sortOrder", sortOrderValue as Number) {
                    min(0)
                }
            }
            // Type-specific validations
            when (value.type) {
                AttributeType.INTEGER -> {
                    value.minInt?.let { minValue ->
                        value.maxInt?.let { maxValue ->
                            if (minValue > maxValue) {
                                addError(
                                    ValidationExceptionError(
                                        field = "minInt",
                                        code = BaseValidationCode.VALUE_IS_INVALID.name,
                                        message = "minInt must be less than or equal to maxInt",
                                    ),
                                )
                            }
                        }
                    }
                }
                AttributeType.DECIMAL -> {
                    value.minDecimal?.let { minValue ->
                        value.maxDecimal?.let { maxValue ->
                            if (minValue > maxValue) {
                                addError(
                                    ValidationExceptionError(
                                        field = "minDecimal",
                                        code = BaseValidationCode.VALUE_IS_INVALID.name,
                                        message = "minDecimal must be less than or equal to maxDecimal",
                                    ),
                                )
                            }
                        }
                    }
                }
                else -> {
                    // ENUM and BOOLEAN don't need numeric validations
                }
            }
        }
}

package cz.vokounova.configurator.products.attributes.infrastructure.rest.validation

import cz.vokounova.configurator.products.attributes.domain.AttributeOptionJsonPatchParams
import cz.vokounova.configurator.products.attributes.domain.AttributeOptionJsonPatchParamsPath
import cz.vokounova.configurator.shared.exceptions.ValidationExceptionError
import cz.vokounova.configurator.shared.validations.AppValidator
import cz.vokounova.configurator.shared.validations.BaseValidationCode
import org.springframework.stereotype.Component

@Component
class AttributeOptionJsonPatchParamsValidator : AppValidator<AttributeOptionJsonPatchParams> {
    override fun validate(value: AttributeOptionJsonPatchParams): List<ValidationExceptionError> =
        validation {
            when (val path = value.path) {
                AttributeOptionJsonPatchParamsPath.VALUE -> {
                    field(path.value, value.value as? String) {
                        notNull()
                        notEmpty()
                    }
                }
                AttributeOptionJsonPatchParamsPath.LABEL -> {
                    field(path.value, value.value as? String) {
                        notNull()
                        notEmpty()
                    }
                }
                AttributeOptionJsonPatchParamsPath.IMAGE_URL -> {
                    // imageUrl can be null, but if provided should not be blank
                    (value.value as? String)?.let {
                        if (it.isBlank()) {
                            addError(
                                ValidationExceptionError(
                                    field = path.value,
                                    code = BaseValidationCode.VALUE_IS_INVALID.name,
                                    message = "Image URL cannot be blank",
                                ),
                            )
                        }
                    }
                }
                AttributeOptionJsonPatchParamsPath.SORT_ORDER -> {
                    field(path.value, value.value as? Number) {
                        notNull()
                        min(0)
                    }
                }
            }
        }
}

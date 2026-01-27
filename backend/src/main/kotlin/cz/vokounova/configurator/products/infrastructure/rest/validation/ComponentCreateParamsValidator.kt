package cz.vokounova.configurator.products.infrastructure.rest.validation

import cz.vokounova.configurator.products.domain.ComponentCreateParams
import cz.vokounova.configurator.shared.exceptions.ValidationExceptionError
import cz.vokounova.configurator.shared.validations.AppValidator
import org.springframework.stereotype.Component

@Component
class ComponentCreateParamsValidator : AppValidator<ComponentCreateParams> {
    override fun validate(value: ComponentCreateParams): List<ValidationExceptionError> =
        validation {
            field("productModelId", value.productModelId.value) {
                notNull()
            }
            field("code", value.code) {
                notNull()
                notEmpty()
            }
            field("label", value.label) {
                notNull()
                notEmpty()
            }
            value.sortOrder?.let { sortOrderValue ->
                field("sortOrder", sortOrderValue as Number) {
                    min(0)
                }
            }
        }
}

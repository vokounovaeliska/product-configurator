package cz.vokounova.configurator.products.components.infrastructure.rest.validation

import cz.vokounova.configurator.products.components.domain.ComponentCreateParams
import cz.vokounova.configurator.shared.exceptions.ValidationExceptionError
import cz.vokounova.configurator.shared.validations.AppValidator
import org.springframework.stereotype.Component

@Component
class ComponentCreateParamsValidator : AppValidator<ComponentCreateParams> {
    override fun validate(value: ComponentCreateParams): List<ValidationExceptionError> =
        validation {
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
            value.imageZIndex?.let { zIndex ->
                field("imageZIndex", zIndex as Number) {
                    min(0)
                }
            }
        }
}

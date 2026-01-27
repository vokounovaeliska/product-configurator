package cz.vokounova.configurator.products.components.infrastructure.rest.validation

import cz.vokounova.configurator.products.components.infrastructure.rest.request.ComponentListQueryParams
import cz.vokounova.configurator.shared.exceptions.ValidationExceptionError
import cz.vokounova.configurator.shared.validations.AppValidator
import org.springframework.stereotype.Component

@Component
class ComponentListQueryParamsValidator : AppValidator<ComponentListQueryParams> {
    override fun validate(value: ComponentListQueryParams): List<ValidationExceptionError> =
        validation {
            value.limit?.let { limitValue ->
                field("limit", limitValue as Number) {
                    min(1)
                    max(100)
                }
            }
        }
}

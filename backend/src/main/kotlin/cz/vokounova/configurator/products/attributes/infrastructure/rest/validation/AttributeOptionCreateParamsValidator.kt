package cz.vokounova.configurator.products.attributes.infrastructure.rest.validation

import cz.vokounova.configurator.products.attributes.domain.AttributeOptionCreateParams
import cz.vokounova.configurator.shared.validations.AppValidator
import org.springframework.stereotype.Component

@Component
class AttributeOptionCreateParamsValidator : AppValidator<AttributeOptionCreateParams> {
    override fun validate(value: AttributeOptionCreateParams) =
        validation {
            field("value", value.value) {
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

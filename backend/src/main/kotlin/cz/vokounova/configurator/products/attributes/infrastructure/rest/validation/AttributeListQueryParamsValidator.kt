package cz.vokounova.configurator.products.attributes.infrastructure.rest.validation

import cz.vokounova.configurator.products.attributes.domain.AttributeSortingConfig
import cz.vokounova.configurator.products.attributes.infrastructure.rest.request.AttributeListQueryParams
import cz.vokounova.configurator.shared.exceptions.ValidationExceptionError
import cz.vokounova.configurator.shared.validations.AppValidator
import org.springframework.stereotype.Component

@Component
class AttributeListQueryParamsValidator : AppValidator<AttributeListQueryParams> {
    override fun validate(value: AttributeListQueryParams): List<ValidationExceptionError> =
        validation {
            value.orderBy?.let { list ->
                list.forEach {
                    field("orderBy", it) {
                        validOrderBy(AttributeSortingConfig)
                    }
                }
            }

            value.limit?.let { limitValue ->
                field("limit", limitValue as Number) {
                    min(1)
                    max(100)
                }
            }
        }
}

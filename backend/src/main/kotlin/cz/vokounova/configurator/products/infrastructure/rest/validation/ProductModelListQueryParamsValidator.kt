package cz.vokounova.configurator.products.infrastructure.rest.validation

import cz.vokounova.configurator.products.domain.ProductModelSortingConfig
import cz.vokounova.configurator.products.infrastructure.rest.request.ProductModelListQueryParams
import cz.vokounova.configurator.shared.exceptions.ValidationExceptionError
import cz.vokounova.configurator.shared.validations.AppValidator
import org.springframework.stereotype.Component

@Component
class ProductModelListQueryParamsValidator : AppValidator<ProductModelListQueryParams> {
    override fun validate(value: ProductModelListQueryParams): List<ValidationExceptionError> =
        validation {
            value.orderBy?.let { list ->
                list.forEach {
                    field("orderBy", it) {
                        validOrderBy(ProductModelSortingConfig)
                    }
                }
            }

            field("limit", value.limit) { min(1) }
        }
}

package cz.vokounova.configurator.products.infrastructure.rest.validation

import cz.vokounova.configurator.products.domain.ProductModel
import cz.vokounova.configurator.products.domain.ProductModelCreateParams
import cz.vokounova.configurator.shared.exceptions.ValidationExceptionError
import cz.vokounova.configurator.shared.validations.AppValidator
import org.springframework.stereotype.Component

@Component
class ProductModelCreateParamsValidator : AppValidator<ProductModelCreateParams> {
    override fun validate(value: ProductModelCreateParams): List<ValidationExceptionError> =
        validation {
            field("name", value.name) {
                notNull()
                notEmpty()
            }
            value.price?.let { priceValue ->
                field("price", priceValue as Number) {
                    min(0.0)
                }
            }
            value.currency?.let { currencyValue ->
                field("currency", currencyValue) {
                    notNull()
                    notEmpty()
                    isOneOf(ProductModel.ALLOWED_CURRENCIES)
                }
            }
        }
}

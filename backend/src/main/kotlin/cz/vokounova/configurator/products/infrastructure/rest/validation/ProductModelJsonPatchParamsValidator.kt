package cz.vokounova.configurator.products.infrastructure.rest.validation

import cz.vokounova.configurator.products.domain.ProductModel
import cz.vokounova.configurator.products.domain.ProductModelJsonPatchParams
import cz.vokounova.configurator.products.domain.ProductModelJsonPatchParamsPath
import cz.vokounova.configurator.shared.exceptions.ValidationExceptionError
import cz.vokounova.configurator.shared.validations.AppValidator
import org.springframework.stereotype.Component

@Component
class ProductModelJsonPatchParamsValidator : AppValidator<ProductModelJsonPatchParams> {
    override fun validate(value: ProductModelJsonPatchParams): List<ValidationExceptionError> =
        validation {
            when (val path = value.path) {
                ProductModelJsonPatchParamsPath.NAME -> {
                    field(path.value, value.value as? String) {
                        notNull()
                        notEmpty()
                    }
                }
                ProductModelJsonPatchParamsPath.DESCRIPTION -> {
                    // Description can be null or empty
                }
                ProductModelJsonPatchParamsPath.PRICE -> {
                    field(path.value, value.value as? Number) {
                        notNull()
                        min(0.0)
                    }
                }
                ProductModelJsonPatchParamsPath.CURRENCY -> {
                    field(path.value, value.value as? String) {
                        notNull()
                        notEmpty()
                        isOneOf(ProductModel.ALLOWED_CURRENCIES)
                    }
                }
                ProductModelJsonPatchParamsPath.IS_ACTIVE -> {
                    anyField(path.value, value.value) {
                        notNull()
                    }
                }
            }
        }
}

package cz.vokounova.configurator.products.models.infrastructure.rest.validation

import cz.vokounova.configurator.products.models.domain.ProductModel
import cz.vokounova.configurator.products.models.domain.ProductModelJsonPatchParams
import cz.vokounova.configurator.products.models.domain.ProductModelJsonPatchParamsPath
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
                ProductModelJsonPatchParamsPath.MODEL_3D_URL -> {
                    field(path.value, value.value as? String) {
                        // Can be null (remove 3D model) or non-empty URL
                        notEmpty()
                    }
                }
                ProductModelJsonPatchParamsPath.MODEL_3D_EFFECTS -> {
                    // Can be null (remove effects) or JSON string from parameters.json
                }
                ProductModelJsonPatchParamsPath.URL -> {
                    field(path.value, value.value as? String) {
                        // URL: lowercase alphanumeric and hyphens; null allowed to unpublish
                        matchPattern("^[a-z0-9]+(?:-[a-z0-9]+)*$")
                    }
                }
                ProductModelJsonPatchParamsPath.IS_PUBLISHED -> {
                    anyField(path.value, value.value) {
                        notNull()
                    }
                }
            }
        }
}

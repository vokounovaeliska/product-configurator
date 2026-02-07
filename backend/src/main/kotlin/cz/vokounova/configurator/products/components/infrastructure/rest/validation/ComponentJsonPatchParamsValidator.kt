package cz.vokounova.configurator.products.components.infrastructure.rest.validation

import cz.vokounova.configurator.products.components.domain.ComponentJsonPatchParams
import cz.vokounova.configurator.products.components.domain.ComponentJsonPatchParamsPath
import cz.vokounova.configurator.shared.exceptions.ValidationExceptionError
import cz.vokounova.configurator.shared.validations.AppValidator
import org.springframework.stereotype.Component

@Component
class ComponentJsonPatchParamsValidator : AppValidator<ComponentJsonPatchParams> {
    override fun validate(value: ComponentJsonPatchParams): List<ValidationExceptionError> =
        validation {
            when (val path = value.path) {
                ComponentJsonPatchParamsPath.CODE -> {
                    field(path.value, value.value as? String) {
                        notNull()
                        notEmpty()
                    }
                }

                ComponentJsonPatchParamsPath.LABEL -> {
                    field(path.value, value.value as? String) {
                        notNull()
                        notEmpty()
                    }
                }

                ComponentJsonPatchParamsPath.DESCRIPTION -> {
                    // Description can be null
                }

                ComponentJsonPatchParamsPath.SORT_ORDER -> {
                    field(path.value, value.value as? Number) {
                        notNull()
                        min(0)
                    }
                }

                ComponentJsonPatchParamsPath.IMAGE_Z_INDEX -> {
                    field(path.value, value.value as? Number) {
                        notNull()
                        min(0)
                    }
                }
            }
        }
}

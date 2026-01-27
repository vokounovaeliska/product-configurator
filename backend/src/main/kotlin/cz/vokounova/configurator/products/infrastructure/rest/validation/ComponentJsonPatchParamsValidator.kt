package cz.vokounova.configurator.products.infrastructure.rest.validation

import cz.vokounova.configurator.products.domain.ComponentJsonPatchParams
import cz.vokounova.configurator.products.domain.ComponentJsonPatchParamsPath
import cz.vokounova.configurator.shared.exceptions.ValidationExceptionError
import cz.vokounova.configurator.shared.rest.jsonpatch.JsonPatchOperation
import cz.vokounova.configurator.shared.validations.AppValidator
import org.springframework.stereotype.Component

@Component
class ComponentJsonPatchParamsValidator : AppValidator<List<ComponentJsonPatchParams>> {
    override fun validate(value: List<ComponentJsonPatchParams>): List<ValidationExceptionError> =
        validation {
            value.forEach { patchParam ->
                when (patchParam.path) {
                    ComponentJsonPatchParamsPath.CODE -> {
                        field(patchParam.path.value, patchParam.value as? String) {
                            notNull()
                            notEmpty()
                        }
                    }

                    ComponentJsonPatchParamsPath.LABEL -> {
                        field(patchParam.path.value, patchParam.value as? String) {
                            notNull()
                            notEmpty()
                        }
                    }

                    ComponentJsonPatchParamsPath.DESCRIPTION -> {
                        // Description can be null
                    }

                    ComponentJsonPatchParamsPath.SORT_ORDER -> {
                        field(patchParam.path.value, patchParam.value as? Number) {
                            notNull()
                            min(0)
                        }
                    }
                }

                field("${patchParam.path.value}.op", patchParam.op) {
                    isOneOf(listOf(JsonPatchOperation.REPLACE))
                }
            }
        }
}

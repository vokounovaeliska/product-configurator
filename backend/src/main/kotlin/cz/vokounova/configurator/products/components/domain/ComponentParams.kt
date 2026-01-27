package cz.vokounova.configurator.products.components.domain

import com.fasterxml.jackson.annotation.JsonValue
import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.shared.rest.jsonpatch.JsonPatchOperation
import cz.vokounova.configurator.shared.rest.jsonpatch.JsonPatchParams

data class ComponentCreateParams(
    val productModelId: ProductModelId,
    val code: String,
    val label: String,
    val description: String? = null,
    val sortOrder: Int? = null,
)

data class ComponentJsonPatchParams(
    override val path: ComponentJsonPatchParamsPath,
    override val value: Any?,
    override val op: JsonPatchOperation,
) : JsonPatchParams<ComponentJsonPatchParamsPath>(path, value, op)

enum class ComponentJsonPatchParamsPath(
    val value: String,
) {
    CODE("/code"),
    LABEL("/label"),
    DESCRIPTION("/description"),
    SORT_ORDER("/sortOrder"),
    ;

    @JsonValue
    fun getEnumValue(): String = value
}

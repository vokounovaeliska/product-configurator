package cz.vokounova.configurator.products.attributes.domain

import com.fasterxml.jackson.annotation.JsonValue
import cz.vokounova.configurator.shared.rest.jsonpatch.JsonPatchOperation
import cz.vokounova.configurator.shared.rest.jsonpatch.JsonPatchParams

data class AttributeOptionJsonPatchParams(
    override val path: AttributeOptionJsonPatchParamsPath,
    override val value: Any?,
    override val op: JsonPatchOperation,
) : JsonPatchParams<AttributeOptionJsonPatchParamsPath>(path, value, op)

enum class AttributeOptionJsonPatchParamsPath(
    val value: String,
) {
    VALUE("/value"),
    LABEL("/label"),
    IMAGE_URL("/imageUrl"),
    SORT_ORDER("/sortOrder"),
    ;

    @JsonValue
    fun getEnumValue(): String = value
}

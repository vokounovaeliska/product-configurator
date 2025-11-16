package cz.vokounova.configurator.shared.rest.jsonpatch

import com.fasterxml.jackson.annotation.JsonValue

abstract class JsonPatchParams<T>(
    open val path: T,
    open val value: Any?,
    open val op: JsonPatchOperation,
)

enum class JsonPatchOperation(
    val value: String,
) {
    REPLACE("replace"),
    ;

    @JsonValue
    fun getEnumValue(): String = value
}

enum class JsonPatchMeasureParam(
    val value: String,
) {
    UNIT("unit"),
    VALUE("value"),
}

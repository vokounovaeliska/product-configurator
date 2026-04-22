package cz.vokounova.configurator.products.attributes.domain

import com.fasterxml.jackson.annotation.JsonValue
import cz.vokounova.configurator.generated.jooq.enums.AttributeType
import cz.vokounova.configurator.products.components.domain.ComponentId
import cz.vokounova.configurator.shared.rest.jsonpatch.JsonPatchOperation
import cz.vokounova.configurator.shared.rest.jsonpatch.JsonPatchParams
import java.math.BigDecimal

data class AttributeCreateParams(
    val componentId: ComponentId,
    val code: String,
    val label: String,
    val type: AttributeType,
    val isRequired: Boolean? = null,
    val minInt: Int? = null,
    val maxInt: Int? = null,
    val minDecimal: BigDecimal? = null,
    val maxDecimal: BigDecimal? = null,
    val defaultInt: Int? = null,
    val defaultDecimal: BigDecimal? = null,
    
    val unit: String? = null,
    val sortOrder: Int? = null,
)

data class AttributeJsonPatchParams(
    override val path: AttributeJsonPatchParamsPath,
    override val value: Any?,
    override val op: JsonPatchOperation,
) : JsonPatchParams<AttributeJsonPatchParamsPath>(path, value, op)

enum class AttributeJsonPatchParamsPath(
    val value: String,
) {
    CODE("/code"),
    LABEL("/label"),
    TYPE("/type"),
    IS_REQUIRED("/isRequired"),
    MIN_INT("/minInt"),
    MAX_INT("/maxInt"),
    MIN_DECIMAL("/minDecimal"),
    MAX_DECIMAL("/maxDecimal"),
    DEFAULT_INT("/defaultInt"),
    DEFAULT_DECIMAL("/defaultDecimal"),
    UNIT("/unit"),
    SORT_ORDER("/sortOrder"),
    ;

    @JsonValue
    fun getEnumValue(): String = value
}

package cz.vokounova.configurator.products.models.domain

import com.fasterxml.jackson.annotation.JsonValue
import cz.vokounova.configurator.shared.rest.jsonpatch.JsonPatchOperation
import cz.vokounova.configurator.shared.rest.jsonpatch.JsonPatchParams
import cz.vokounova.configurator.users.api.dto.UserIdDto

data class ProductModelCreateParams(
    val userId: UserIdDto,
    val name: String,
    val description: String? = null,
    val price: Double? = null,
    val currency: String? = null,
    val isActive: Boolean? = null,
)

data class ProductModelJsonPatchParams(
    override val path: ProductModelJsonPatchParamsPath,
    override val value: Any?,
    override val op: JsonPatchOperation,
) : JsonPatchParams<ProductModelJsonPatchParamsPath>(path, value, op)

enum class ProductModelJsonPatchParamsPath(
    val value: String,
) {
    NAME("/name"),
    DESCRIPTION("/description"),
    PRICE("/price"),
    CURRENCY("/currency"),
    IS_ACTIVE("/isActive"),
    ;

    @JsonValue
    fun getEnumValue(): String = value
}

package cz.vokounova.configurator.products.attributes.ports.inbound

import cz.vokounova.configurator.products.attributes.domain.AttributeId
import cz.vokounova.configurator.products.attributes.domain.AttributeOption
import cz.vokounova.configurator.products.attributes.domain.AttributeOptionCreateParams
import cz.vokounova.configurator.products.attributes.domain.AttributeOptionId
import cz.vokounova.configurator.products.attributes.domain.AttributeOptionJsonPatchParams

interface AttributeOptionAPI {
    fun create(params: AttributeOptionCreateParams): AttributeOption

    fun delete(id: AttributeOptionId)

    fun getOne(id: AttributeOptionId): AttributeOption

    fun getByAttributeId(attributeId: AttributeId): List<AttributeOption>

    fun patch(
        id: AttributeOptionId,
        jsonPatchParams: List<AttributeOptionJsonPatchParams>,
    ): AttributeOption
}

package cz.vokounova.configurator.products.attributes.application.usecase

import cz.vokounova.configurator.generated.jooq.enums.AttributeType
import cz.vokounova.configurator.products.attributes.application.exception.AttributeErrorCode
import cz.vokounova.configurator.products.attributes.application.exception.AttributeException
import cz.vokounova.configurator.products.attributes.domain.AttributeId
import cz.vokounova.configurator.products.attributes.domain.AttributeOption
import cz.vokounova.configurator.products.attributes.domain.AttributeOptionCreateParams
import cz.vokounova.configurator.products.attributes.domain.AttributeOptionId
import cz.vokounova.configurator.products.attributes.domain.AttributeOptionJsonPatchParams
import cz.vokounova.configurator.products.attributes.ports.inbound.AttributeAPI
import cz.vokounova.configurator.products.attributes.ports.inbound.AttributeOptionAPI
import cz.vokounova.configurator.products.attributes.ports.outbound.AttributeOptionRepository
import cz.vokounova.configurator.shared.exceptions.ResourceNotFoundException
import cz.vokounova.configurator.shared.jsonpatch.JsonPatchUtils
import org.springframework.stereotype.Component as ComponentStereotype
import org.springframework.transaction.annotation.Transactional

@ComponentStereotype
class AttributeOptionAPIManager(
    private val attributeOptionRepository: AttributeOptionRepository,
    private val attributeAPI: AttributeAPI,
    private val jsonPatchUtils: JsonPatchUtils,
) : AttributeOptionAPI {
    @Transactional
    override fun create(params: AttributeOptionCreateParams): AttributeOption {
        // Validate that the attribute exists and is of type ENUM
        val attribute = attributeAPI.getOne(params.attributeId)
        if (attribute.type != AttributeType.ENUM) {
            throw AttributeException(
                AttributeErrorCode.INVALID_ATTRIBUTE_TYPE_CONFIGURATION,
                "Attribute options can only be created for ENUM type attributes",
            )
        }

        val option = AttributeOption.create(params)
        return attributeOptionRepository.create(option)
            ?: throw AttributeException(AttributeErrorCode.CREATE_ATTRIBUTE_OPTION_FAILED)
    }

    @Transactional
    override fun delete(id: AttributeOptionId) {
        val deletedCount = attributeOptionRepository.delete(id)
        if (deletedCount == 0) {
            throw ResourceNotFoundException("Attribute option with id ${id.value} not found")
        }
    }

    override fun getOne(id: AttributeOptionId): AttributeOption = findAttributeOption(id)

    override fun getByAttributeId(attributeId: AttributeId): List<AttributeOption> =
        attributeOptionRepository.findByAttributeId(attributeId)

    @Transactional
    override fun patch(
        id: AttributeOptionId,
        jsonPatchParams: List<AttributeOptionJsonPatchParams>,
    ): AttributeOption {
        val existingOption = findAttributeOption(id)
        val patched = jsonPatchUtils.applyAndMapJsonPatch(jsonPatchParams, existingOption)

        return attributeOptionRepository.update(patched)
            ?: throw AttributeException(AttributeErrorCode.UPDATE_ATTRIBUTE_OPTION_FAILED)
    }

    private fun findAttributeOption(id: AttributeOptionId): AttributeOption =
        attributeOptionRepository.findById(id)
            ?: throw ResourceNotFoundException("Attribute option with id ${id.value} is not found.")
}

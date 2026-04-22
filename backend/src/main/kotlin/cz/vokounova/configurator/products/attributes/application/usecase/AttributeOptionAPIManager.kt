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
import cz.vokounova.configurator.products.components.ports.inbound.ComponentAPI
import cz.vokounova.configurator.products.pricing.DefaultPricingRulesService
import cz.vokounova.configurator.shared.exceptions.ResourceNotFoundException
import cz.vokounova.configurator.shared.files.UploadedFileDeleter
import cz.vokounova.configurator.shared.jsonpatch.JsonPatchUtils
import org.springframework.transaction.annotation.Transactional
import org.springframework.stereotype.Component as ComponentStereotype

@ComponentStereotype
class AttributeOptionAPIManager(
    private val attributeOptionRepository: AttributeOptionRepository,
    private val attributeAPI: AttributeAPI,
    private val componentAPI: ComponentAPI,
    private val defaultPricingRulesService: DefaultPricingRulesService,
    private val jsonPatchUtils: JsonPatchUtils,
    private val uploadedFileDeleter: UploadedFileDeleter,
) : AttributeOptionAPI {
    @Transactional
    override fun create(params: AttributeOptionCreateParams): AttributeOption {
        val attribute = attributeAPI.getOne(params.attributeId)
        if (attribute.type != AttributeType.ENUM) {
            throw AttributeException(
                AttributeErrorCode.INVALID_ATTRIBUTE_TYPE_CONFIGURATION,
                "Attribute options can only be created for ENUM type attributes",
            )
        }

        val option = AttributeOption.create(params)
        val created =
            attributeOptionRepository.create(option)
                ?: throw AttributeException(AttributeErrorCode.CREATE_ATTRIBUTE_OPTION_FAILED)

        val component = componentAPI.getOne(attribute.componentId)
        defaultPricingRulesService.createDefaultForOptionIfMissing(
            productModelId = component.productModelId.value,
            componentId = attribute.componentId.value,
            attributeCode = attribute.code,
            optionValue = created.value,
        )
        return created
    }

    @Transactional
    override fun delete(id: AttributeOptionId) {
        val existing =
            attributeOptionRepository.findById(id)
                ?: throw ResourceNotFoundException(
                    "Attribute option with id ${id.value} not found",
                )
        val attribute = attributeAPI.getOne(existing.attributeId)
        val component = componentAPI.getOne(attribute.componentId)
        defaultPricingRulesService.deleteForOptionValue(
            productModelId = component.productModelId.value,
            componentId = attribute.componentId.value,
            attributeCode = attribute.code,
            optionValue = existing.value,
        )
        deleteImageIfUnused(existing.imageUrl, excludeOptionIds = setOf(id))
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
        if (existingOption.imageUrl != patched.imageUrl && !existingOption.imageUrl.isNullOrBlank()) {
            deleteImageIfUnused(existingOption.imageUrl, excludeOptionIds = setOf(id))
        }
        return attributeOptionRepository.update(patched)
            ?: throw AttributeException(AttributeErrorCode.UPDATE_ATTRIBUTE_OPTION_FAILED)
    }

    private fun findAttributeOption(id: AttributeOptionId): AttributeOption =
        attributeOptionRepository.findById(id)
            ?: throw ResourceNotFoundException("Attribute option with id ${id.value} is not found.")

    private fun deleteImageIfUnused(
        imageUrl: String?,
        excludeOptionIds: Set<AttributeOptionId>,
    ) {
        if (imageUrl.isNullOrBlank()) return
        if (!attributeOptionRepository.existsOtherOptionWithImageUrl(imageUrl, excludeOptionIds)) {
            uploadedFileDeleter.deleteByUrl(imageUrl)
        }
    }
}

package cz.vokounova.configurator.products.attributes.application.usecase

import cz.vokounova.configurator.generated.jooq.enums.AttributeType
import cz.vokounova.configurator.products.attributes.application.exception.AttributeErrorCode
import cz.vokounova.configurator.products.attributes.application.exception.AttributeException
import cz.vokounova.configurator.products.attributes.application.validation.AttributeDomainValidator
import cz.vokounova.configurator.products.attributes.domain.Attribute
import cz.vokounova.configurator.products.attributes.domain.AttributeCreateParams
import cz.vokounova.configurator.products.attributes.domain.AttributeFilter
import cz.vokounova.configurator.products.attributes.domain.AttributeId
import cz.vokounova.configurator.products.attributes.domain.AttributeJsonPatchParams
import cz.vokounova.configurator.products.attributes.domain.AttributeSortableField
import cz.vokounova.configurator.products.attributes.ports.inbound.AttributeAPI
import cz.vokounova.configurator.products.attributes.ports.outbound.AttributeOptionRepository
import cz.vokounova.configurator.products.attributes.ports.outbound.AttributeRepository
import cz.vokounova.configurator.shared.files.UploadedFileDeleter
import cz.vokounova.configurator.shared.exceptions.ResourceNotFoundException
import cz.vokounova.configurator.shared.jsonpatch.JsonPatchUtils
import cz.vokounova.configurator.shared.pagination.PaginatedResult
import cz.vokounova.configurator.shared.pagination.PaginationRequest
import org.springframework.stereotype.Component as ComponentStereotype
import org.springframework.transaction.annotation.Transactional

@ComponentStereotype
class AttributeAPIManager(
    private val attributeRepository: AttributeRepository,
    private val attributeOptionRepository: AttributeOptionRepository,
    private val uploadedFileDeleter: UploadedFileDeleter,
    private val jsonPatchUtils: JsonPatchUtils,
    private val attributeDomainValidator: AttributeDomainValidator,
) : AttributeAPI {
    @Transactional
    override fun create(params: AttributeCreateParams): Attribute {
        val attribute = Attribute.create(params)
        attributeDomainValidator.validate(attribute)
        return attributeRepository.create(attribute)
            ?: throw AttributeException(AttributeErrorCode.CREATE_ATTRIBUTE_FAILED)
    }

    @Transactional
    override fun delete(id: AttributeId) {
        attributeOptionRepository.findByAttributeId(id).forEach { option ->
            uploadedFileDeleter.deleteByUrl(option.imageUrl)
        }
        attributeOptionRepository.deleteByAttributeId(id)
        val deletedCount = attributeRepository.delete(id)
        if (deletedCount == 0) {
            throw ResourceNotFoundException("Attribute with id ${id.value} not found")
        }
    }

    override fun getOne(id: AttributeId): Attribute = findAttribute(id)

    override fun getList(): List<Attribute> = attributeRepository.findByFilter()

    @Transactional
    override fun patch(
        id: AttributeId,
        jsonPatchParams: List<AttributeJsonPatchParams>,
    ): Attribute {
        val existingAttribute = findAttribute(id, lock = true)
        val patched = jsonPatchUtils.applyAndMapJsonPatch(jsonPatchParams, existingAttribute)

        // Validate type configuration after patch
        attributeDomainValidator.validate(patched)

        return attributeRepository.update(patched)
            ?: throw AttributeException(AttributeErrorCode.UPDATE_ATTRIBUTE_FAILED)
    }

    override fun getByFilterPaginated(
        filter: AttributeFilter,
        paginationRequest: PaginationRequest<AttributeSortableField>,
    ): PaginatedResult<Attribute> = attributeRepository.findByFilterPaginated(filter, paginationRequest)

    private fun findAttribute(
        id: AttributeId,
        lock: Boolean = false,
    ): Attribute =
        attributeRepository.findById(id, lock)
            ?: throw ResourceNotFoundException("Attribute with id ${id.value} is not found.")
}

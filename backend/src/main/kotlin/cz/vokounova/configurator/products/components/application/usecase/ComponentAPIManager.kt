package cz.vokounova.configurator.products.components.application.usecase

import cz.vokounova.configurator.products.components.application.exception.ComponentErrorCode
import cz.vokounova.configurator.products.components.application.exception.ComponentException
import cz.vokounova.configurator.products.components.domain.Component
import cz.vokounova.configurator.products.components.domain.ComponentCreateParams
import cz.vokounova.configurator.products.components.domain.ComponentFilter
import cz.vokounova.configurator.products.components.domain.ComponentId
import cz.vokounova.configurator.products.components.domain.ComponentJsonPatchParams
import cz.vokounova.configurator.products.components.domain.ComponentSortableField
import cz.vokounova.configurator.products.components.ports.inbound.ComponentAPI
import cz.vokounova.configurator.products.components.ports.outbound.ComponentRepository
import cz.vokounova.configurator.shared.exceptions.ResourceNotFoundException
import cz.vokounova.configurator.shared.jsonpatch.JsonPatchUtils
import cz.vokounova.configurator.shared.pagination.PaginatedResult
import cz.vokounova.configurator.shared.pagination.PaginationRequest
import org.springframework.transaction.annotation.Transactional
import org.springframework.stereotype.Component as ComponentStereotype

@ComponentStereotype
class ComponentAPIManager(
    private val componentRepository: ComponentRepository,
    private val jsonPatchUtils: JsonPatchUtils,
) : ComponentAPI {
    @Transactional
    override fun create(params: ComponentCreateParams): Component {
        val component = Component.create(params)
        return componentRepository.create(component)
            ?: throw ComponentException(ComponentErrorCode.CREATE_COMPONENT_FAILED)
    }

    @Transactional
    override fun delete(id: ComponentId) {
        val deletedCount = componentRepository.delete(id)
        if (deletedCount == 0) {
            throw ResourceNotFoundException("Component with id ${id.value} not found")
        }
    }

    override fun getOne(id: ComponentId): Component = findComponent(id)

    override fun getList(): List<Component> = componentRepository.findByFilter()

    @Transactional
    override fun patch(
        id: ComponentId,
        jsonPatchParams: List<ComponentJsonPatchParams>,
    ): Component {
        val existingComponent = findComponent(id, lock = true)
        val patched = jsonPatchUtils.applyAndMapJsonPatch(jsonPatchParams, existingComponent)

        return componentRepository.update(patched)
            ?: throw ComponentException(ComponentErrorCode.UPDATE_COMPONENT_FAILED)
    }

    override fun getByFilterPaginated(
        filter: ComponentFilter,
        paginationRequest: PaginationRequest<ComponentSortableField>,
    ): PaginatedResult<Component> = componentRepository.findByFilterPaginated(filter, paginationRequest)

    private fun findComponent(
        id: ComponentId,
        lock: Boolean = false,
    ): Component =
        componentRepository.findById(id, lock)
            ?: throw ResourceNotFoundException("Component with id ${id.value} is not found.")
}

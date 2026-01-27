package cz.vokounova.configurator.products

import cz.vokounova.configurator.generated.jooq.tables.references.COMPONENT_DEFINITION
import cz.vokounova.configurator.products.domain.Component
import cz.vokounova.configurator.products.domain.ComponentFilter
import cz.vokounova.configurator.products.domain.ComponentId
import cz.vokounova.configurator.products.domain.ComponentSortableField
import cz.vokounova.configurator.products.infrastructure.persistence.mapper.toDomain
import cz.vokounova.configurator.products.infrastructure.persistence.mapper.toOrderFields
import cz.vokounova.configurator.products.infrastructure.persistence.mapper.toPersistence
import cz.vokounova.configurator.products.ports.outbound.ComponentRepository
import cz.vokounova.configurator.products.toPagination
import cz.vokounova.configurator.shared.pagination.CursorCodec
import cz.vokounova.configurator.shared.pagination.FinalPageRequest
import cz.vokounova.configurator.shared.pagination.PageAfterRequest
import cz.vokounova.configurator.shared.pagination.PageBeforeRequest
import cz.vokounova.configurator.shared.pagination.PaginatedResult
import cz.vokounova.configurator.shared.pagination.PaginationRequest
import cz.vokounova.configurator.shared.pagination.jooq.FirstPageRequest
import cz.vokounova.configurator.shared.pagination.jooq.LastPageRequest
import cz.vokounova.configurator.shared.pagination.jooq.NextPageRequest
import cz.vokounova.configurator.shared.pagination.jooq.PageResult
import cz.vokounova.configurator.shared.pagination.jooq.PreviousPageRequest
import cz.vokounova.configurator.shared.pagination.jooq.useSeekPagination
import org.jooq.Condition
import org.jooq.DSLContext
import java.time.OffsetDateTime

@Component
class ComponentRepositoryDB(
    private val dslContext: DSLContext,
    private val cursorCodec: CursorCodec<ComponentPagination>,
) : ComponentRepository {
    override fun findById(
        id: ComponentId,
        lock: Boolean,
    ): Component? =
        dslContext
            .selectFrom(COMPONENT_DEFINITION)
            .where(COMPONENT_DEFINITION.ID.eq(id.value))
            .run { if (lock) this.forUpdate() else this }
            .fetchOne()
            ?.toDomain()

    override fun findByFilter(filter: ComponentFilter?): List<Component> =
        dslContext
            .selectFrom(COMPONENT_DEFINITION)
            .apply {
                filter?.let {
                    where(buildFilterConditions(filter))
                }
            }.fetch()
            .map { it.toDomain() }

    override fun create(component: Component): Component? {
        val record = component.toPersistence()

        return dslContext
            .insertInto(COMPONENT_DEFINITION)
            .set(record)
            .returning()
            .fetchOne()
            ?.toDomain()
    }

    override fun update(component: Component): Component? {
        val updatedComponent = component.copy(modifiedAt = OffsetDateTime.now())
        val record = updatedComponent.toPersistence()

        return dslContext
            .update(COMPONENT_DEFINITION)
            .set(record)
            .where(COMPONENT_DEFINITION.ID.eq(record.id))
            .returning()
            .fetchOne()
            ?.toDomain()
    }

    override fun delete(id: ComponentId): Int =
        dslContext
            .deleteFrom(COMPONENT_DEFINITION)
            .where(COMPONENT_DEFINITION.ID.eq(id.value))
            .execute()

    override fun findByFilterPaginated(
        filter: ComponentFilter,
        paginationRequest: PaginationRequest<ComponentSortableField>,
    ): PaginatedResult<Component> {
        val filterConditions = buildFilterConditions(filter)
        val pageRequest =
            when (paginationRequest) {
                is PageAfterRequest -> {
                    val pagination = cursorCodec.decode(paginationRequest.after, ComponentPagination::class.java)
                    NextPageRequest(
                        table = COMPONENT_DEFINITION,
                        cursorFieldValues = pagination.toPaginationFieldsValueMap(),
                        orderFields = ComponentPagination.toOrderFields(paginationRequest.orderByFields),
                        filterConditions = filterConditions,
                        pageSize = paginationRequest.limit,
                    )
                }

                is PageBeforeRequest -> {
                    val pagination = cursorCodec.decode(paginationRequest.before, ComponentPagination::class.java)
                    PreviousPageRequest(
                        table = COMPONENT_DEFINITION,
                        cursorFieldValues = pagination.toPaginationFieldsValueMap(),
                        orderFields = ComponentPagination.toOrderFields(paginationRequest.orderByFields),
                        filterConditions = filterConditions,
                        pageSize = paginationRequest.limit,
                    )
                }

                is FinalPageRequest -> {
                    if (paginationRequest.orderByFields
                            .firstOrNull()
                            ?.order
                            ?.isAscending == true
                    ) {
                        FirstPageRequest(
                            table = COMPONENT_DEFINITION,
                            orderFields = ComponentPagination.toOrderFields(paginationRequest.orderByFields),
                            filterConditions = filterConditions,
                            pageSize = paginationRequest.limit,
                        )
                    } else {
                        LastPageRequest(
                            table = COMPONENT_DEFINITION,
                            orderFields = ComponentPagination.toOrderFields(paginationRequest.orderByFields),
                            filterConditions = filterConditions,
                            pageSize = paginationRequest.limit,
                        )
                    }
                }
            }

        return dslContext.useSeekPagination(pageRequest) { pageResult: PageResult ->
            val components = pageResult.data.map { it.toDomain() }
            val cursorAfter =
                pageResult.cursorAfter?.toPagination(paginationRequest.orderByFields)
            val cursorBefore =
                pageResult.cursorBefore?.toPagination(paginationRequest.orderByFields)

            PaginatedResult(
                data = components,
                cursorAfter = cursorAfter?.let { cursorCodec.encode(it) },
                cursorBefore = cursorBefore?.let { cursorCodec.encode(it) },
                pagesTotal = pageResult.pagesTotal,
            )
        }
    }

    private fun buildFilterConditions(filter: ComponentFilter): Condition? {
        val conditions = mutableListOf<Condition>()

        filter.productModelIds?.let {
            if (it.isNotEmpty()) {
                conditions.add(
                    COMPONENT_DEFINITION.PRODUCT_MODEL_ID.`in`(it.map { id -> id.value }),
                )
            }
        }

        filter.ids?.let {
            if (it.isNotEmpty()) {
                conditions.add(
                    COMPONENT_DEFINITION.ID.`in`(it.map { id -> id.value }),
                )
            }
        }

        return if (conditions.isEmpty()) null else conditions.reduce { acc, condition -> acc.and(condition) }
    }
}

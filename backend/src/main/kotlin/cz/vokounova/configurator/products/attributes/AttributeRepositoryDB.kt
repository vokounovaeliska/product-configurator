package cz.vokounova.configurator.products.attributes

import cz.vokounova.configurator.generated.jooq.tables.records.AttributeDefinitionRecord
import cz.vokounova.configurator.generated.jooq.tables.references.ATTRIBUTE_DEFINITION
import cz.vokounova.configurator.products.attributes.domain.Attribute
import cz.vokounova.configurator.products.attributes.domain.AttributeFilter
import cz.vokounova.configurator.products.attributes.domain.AttributeId
import cz.vokounova.configurator.products.attributes.domain.AttributeSortableField
import cz.vokounova.configurator.products.attributes.infrastructure.persistence.mapper.toDomain
import cz.vokounova.configurator.products.attributes.infrastructure.persistence.mapper.toPersistence
import cz.vokounova.configurator.products.attributes.ports.outbound.AttributeRepository
import cz.vokounova.configurator.shared.pagination.CursorCodec
import cz.vokounova.configurator.shared.pagination.FinalPageRequest
import cz.vokounova.configurator.shared.pagination.OrderBy
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
import org.springframework.stereotype.Component as ComponentStereotype

@ComponentStereotype
class AttributeRepositoryDB(
    private val dslContext: DSLContext,
    private val cursorCodec: CursorCodec<AttributePagination>,
) : AttributeRepository {
    override fun findById(
        id: AttributeId,
        lock: Boolean,
    ): Attribute? =
        dslContext
            .selectFrom(ATTRIBUTE_DEFINITION)
            .where(ATTRIBUTE_DEFINITION.ID.eq(id.value))
            .run { if (lock) this.forUpdate() else this }
            .fetchOne()
            ?.toDomain()

    override fun findByFilter(filter: AttributeFilter?): List<Attribute> =
        dslContext
            .selectFrom(ATTRIBUTE_DEFINITION)
            .apply {
                filter?.let {
                    val conditions = buildFilterConditions(filter)
                    if (conditions.isNotEmpty()) {
                        where(conditions.reduce { acc, condition -> acc.and(condition) })
                    }
                }
            }.fetch()
            .map { it.toDomain() }

    override fun create(attribute: Attribute): Attribute? {
        val record = attribute.toPersistence()

        return dslContext
            .insertInto(ATTRIBUTE_DEFINITION)
            .set(record)
            .returning()
            .fetchOne()
            ?.toDomain()
    }

    override fun update(attribute: Attribute): Attribute? {
        val updatedAttribute = attribute.copy(modifiedAt = OffsetDateTime.now())
        val record = updatedAttribute.toPersistence()

        return dslContext
            .update(ATTRIBUTE_DEFINITION)
            .set(record)
            .where(ATTRIBUTE_DEFINITION.ID.eq(record.id))
            .returning()
            .fetchOne()
            ?.toDomain()
    }

    override fun delete(id: AttributeId): Int =
        dslContext
            .deleteFrom(ATTRIBUTE_DEFINITION)
            .where(ATTRIBUTE_DEFINITION.ID.eq(id.value))
            .execute()

    override fun findByFilterPaginated(
        filter: AttributeFilter,
        paginationRequest: PaginationRequest<AttributeSortableField>,
    ): PaginatedResult<Attribute> {
        val filterConditions = buildFilterConditions(filter)
        val pageRequest =
            when (paginationRequest) {
                is PageAfterRequest -> {
                    val pagination = cursorCodec.decode(paginationRequest.after, AttributePagination::class.java)
                    NextPageRequest(
                        table = ATTRIBUTE_DEFINITION,
                        cursorFieldValues = pagination.toPaginationFieldsValueMap(),
                        orderFields = AttributePagination.toOrderFields(paginationRequest.orderByFields),
                        filterConditions = filterConditions,
                        pageSize = paginationRequest.limit,
                    )
                }

                is PageBeforeRequest -> {
                    val pagination = cursorCodec.decode(paginationRequest.before, AttributePagination::class.java)
                    PreviousPageRequest(
                        table = ATTRIBUTE_DEFINITION,
                        cursorFieldValues = pagination.toPaginationFieldsValueMap(),
                        orderFields = AttributePagination.toOrderFields(paginationRequest.orderByFields),
                        filterConditions = filterConditions,
                        pageSize = paginationRequest.limit,
                    )
                }

                is FinalPageRequest -> {
                    LastPageRequest(
                        table = ATTRIBUTE_DEFINITION,
                        orderFields = AttributePagination.toOrderFields(paginationRequest.orderByFields),
                        filterConditions = filterConditions,
                        pageSize = paginationRequest.limit,
                    )
                }

                else -> {
                    FirstPageRequest(
                        table = ATTRIBUTE_DEFINITION,
                        orderFields = AttributePagination.toOrderFields(paginationRequest.orderByFields),
                        filterConditions = filterConditions,
                        pageSize = paginationRequest.limit,
                    )
                }
            }

        val page = dslContext.useSeekPagination().getPage(pageRequest)
        return getPaginatedResult(page, paginationRequest.orderByFields)
    }

    private fun getPaginatedResult(
        pageResult: PageResult<AttributeDefinitionRecord>,
        usedOrderByFields: List<OrderBy<AttributeSortableField>>,
    ): PaginatedResult<Attribute> {
        val data = pageResult.data.map { it.toDomain() }

        val cursorBefore =
            pageResult.before?.let {
                cursorCodec.encode(it.toPagination(usedOrderByFields))
            }
        val cursorAfter =
            pageResult.after?.let {
                cursorCodec.encode(it.toPagination(usedOrderByFields))
            }

        return PaginatedResult(
            data = data,
            pagesTotal = pageResult.pagesTotal,
            cursorBefore = cursorBefore,
            cursorAfter = cursorAfter,
        )
    }

    private fun buildFilterConditions(filter: AttributeFilter): List<Condition> {
        val conditions = mutableListOf<Condition>()

        filter.componentIds?.let {
            if (it.isNotEmpty()) {
                conditions.add(
                    ATTRIBUTE_DEFINITION.COMPONENT_ID.`in`(it.map { id -> id.value }),
                )
            }
        }

        filter.ids?.let {
            if (it.isNotEmpty()) {
                conditions.add(
                    ATTRIBUTE_DEFINITION.ID.`in`(it.map { id -> id.value }),
                )
            }
        }

        filter.types?.let {
            if (it.isNotEmpty()) {
                conditions.add(
                    ATTRIBUTE_DEFINITION.TYPE.`in`(it),
                )
            }
        }

        return conditions
    }
}

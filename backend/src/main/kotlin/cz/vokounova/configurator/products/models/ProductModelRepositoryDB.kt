package cz.vokounova.configurator.products.models

import cz.vokounova.configurator.generated.jooq.tables.records.ProductModelRecord
import cz.vokounova.configurator.generated.jooq.tables.references.PRODUCT_MODEL
import cz.vokounova.configurator.products.models.domain.ProductModel
import cz.vokounova.configurator.products.models.domain.ProductModelFilter
import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.products.models.domain.ProductModelSortableField
import cz.vokounova.configurator.products.models.infrastructure.persistence.mapper.toDomain
import cz.vokounova.configurator.products.models.infrastructure.persistence.mapper.toPersistence
import cz.vokounova.configurator.products.models.ports.outbound.ProductModelRepository
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
import org.springframework.stereotype.Component
import java.time.OffsetDateTime
import java.util.UUID

@Component
class ProductModelRepositoryDB(
    private val dslContext: DSLContext,
    private val cursorCodec: CursorCodec<ProductModelPagination>,
) : ProductModelRepository {
    override fun findPublishedByUserIdAndUrl(
        userId: UUID,
        url: String,
    ): ProductModel? =
        dslContext
            .selectFrom(PRODUCT_MODEL)
            .where(PRODUCT_MODEL.USER_ID.eq(userId))
            .and(PRODUCT_MODEL.URL.eq(url))
            .and(PRODUCT_MODEL.IS_PUBLISHED.eq(true))
            .fetchOne()
            ?.toDomain()

    override fun findById(
        id: ProductModelId,
        lock: Boolean,
    ): ProductModel? =
        dslContext
            .selectFrom(PRODUCT_MODEL)
            .where(PRODUCT_MODEL.ID.eq(id.value))
            .run { if (lock) this.forUpdate() else this }
            .fetchOne()
            ?.toDomain()

    override fun findByFilter(filter: ProductModelFilter?): List<ProductModel> =
        dslContext
            .selectFrom(PRODUCT_MODEL)
            .apply {
                filter?.let {
                    where(buildFilterConditions(filter))
                }
            }.fetch()
            .map { it.toDomain() }

    override fun create(productModel: ProductModel): ProductModel? =
        dslContext
            .insertInto(PRODUCT_MODEL)
            .set(productModel.toPersistence())
            .returning()
            .fetchOne()
            ?.toDomain()

    override fun update(productModel: ProductModel): ProductModel? {
        val updatedProductModel = productModel.copy(modifiedAt = OffsetDateTime.now())
        val record = updatedProductModel.toPersistence()
        return dslContext
            .update(PRODUCT_MODEL)
            .set(record)
            .where(PRODUCT_MODEL.ID.eq(record.id))
            .returning()
            .fetchOne()
            ?.toDomain()
    }

    override fun delete(id: ProductModelId): Int =
        dslContext
            .deleteFrom(PRODUCT_MODEL)
            .where(PRODUCT_MODEL.ID.eq(id.value))
            .execute()

    override fun findByFilterPaginated(
        filter: ProductModelFilter,
        paginationRequest: PaginationRequest<ProductModelSortableField>,
    ): PaginatedResult<ProductModel> {
        val filterConditions = buildFilterConditions(filter)
        val pageRequest =
            when (paginationRequest) {
                is PageAfterRequest -> {
                    val pagination = cursorCodec.decode(paginationRequest.after, ProductModelPagination::class.java)
                    NextPageRequest(
                        table = PRODUCT_MODEL,
                        cursorFieldValues = pagination.toPaginationFieldsValueMap(),
                        orderFields = ProductModelPagination.toOrderFields(paginationRequest.orderByFields),
                        filterConditions = filterConditions,
                        pageSize = paginationRequest.limit,
                    )
                }

                is PageBeforeRequest -> {
                    val pagination = cursorCodec.decode(paginationRequest.before, ProductModelPagination::class.java)
                    PreviousPageRequest(
                        table = PRODUCT_MODEL,
                        cursorFieldValues = pagination.toPaginationFieldsValueMap(),
                        orderFields = ProductModelPagination.toOrderFields(paginationRequest.orderByFields),
                        filterConditions = filterConditions,
                        pageSize = paginationRequest.limit,
                    )
                }

                is FinalPageRequest -> {
                    LastPageRequest(
                        table = PRODUCT_MODEL,
                        orderFields = ProductModelPagination.toOrderFields(paginationRequest.orderByFields),
                        filterConditions = filterConditions,
                        pageSize = paginationRequest.limit,
                    )
                }

                else -> {
                    FirstPageRequest(
                        table = PRODUCT_MODEL,
                        orderFields = ProductModelPagination.toOrderFields(paginationRequest.orderByFields),
                        filterConditions = filterConditions,
                        pageSize = paginationRequest.limit,
                    )
                }
            }

        val page = dslContext.useSeekPagination().getPage(pageRequest)
        return getPaginatedResult(page, paginationRequest.orderByFields)
    }

    private fun getPaginatedResult(
        pageResult: PageResult<ProductModelRecord>,
        usedOrderByFields: List<OrderBy<ProductModelSortableField>>,
    ): PaginatedResult<ProductModel> {
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

    private fun buildFilterConditions(filter: ProductModelFilter): List<Condition> {
        val conditions = mutableListOf<Condition>()

        filter.ids?.let { ids ->
            conditions.add(
                PRODUCT_MODEL.ID.`in`(ids.map { it.value }),
            )
        }

        filter.userIds?.let { userIds ->
            conditions.add(
                PRODUCT_MODEL.USER_ID.`in`(userIds.map { it.value }),
            )
        }

        filter.isActive?.let { isActive ->
            conditions.add(
                PRODUCT_MODEL.IS_ACTIVE.eq(isActive),
            )
        }

        filter.isPublished?.let { isPublished ->
            conditions.add(
                PRODUCT_MODEL.IS_PUBLISHED.eq(isPublished),
            )
        }

        return conditions
    }
}

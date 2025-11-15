package cz.vokounova.configurator.shared.pagination.jooq

import cz.vokounova.configurator.shared.exceptions.PaginationErrorCode
import cz.vokounova.configurator.shared.exceptions.PaginationException
import org.jooq.Condition
import org.jooq.DSLContext
import org.jooq.Field
import org.jooq.Record
import org.jooq.SelectConditionStep
import org.jooq.SortOrder
import org.jooq.Table

fun DSLContext.useSeekPagination() = SeekPagination(this)

data class NextPageRequest<R : Record>(
    val cursorFieldValues: Map<Field<*>, Any>,
    val orderFields: Map<Field<*>, SortOrder>,
    override val table: Table<R>,
    override val filterConditions: List<Condition>,
    override val pageSize: Int,
) : PageRequest<R>(table, filterConditions, pageSize)

data class PreviousPageRequest<R : Record>(
    val cursorFieldValues: Map<Field<*>, Any>,
    val orderFields: Map<Field<*>, SortOrder>,
    override val table: Table<R>,
    override val filterConditions: List<Condition>,
    override val pageSize: Int,
) : PageRequest<R>(table, filterConditions, pageSize)

data class FirstPageRequest<R : Record>(
    val orderFields: Map<Field<*>, SortOrder>,
    override val table: Table<R>,
    override val filterConditions: List<Condition>,
    override val pageSize: Int,
) : PageRequest<R>(table, filterConditions, pageSize)

data class LastPageRequest<R : Record>(
    val orderFields: Map<Field<*>, SortOrder>,
    override val table: Table<R>,
    override val filterConditions: List<Condition>,
    override val pageSize: Int,
) : PageRequest<R>(table, filterConditions, pageSize)

abstract class PageRequest<R : Record>(
    open val table: Table<R>,
    open val filterConditions: List<Condition>,
    open val pageSize: Int,
)

data class PageResult<T>(
    val data: List<T>,
    val pagesTotal: Int,
    val orderByFields: List<Field<*>>,
    val after: T?,
    val before: T?,
)

/*
jOOQ has broken seekBefore at the moment
Backward seek is implemented through normal seek with flipped ordering and reversed result list
https://github.com/jOOQ/jOOQ/issues/6380#issuecomment-1114764613
 */
class SeekPagination(
    private val dsl: DSLContext,
) {
    fun <R : Record> getPage(
        pageRequest: PageRequest<R>,
        distinct: Boolean = false,
        fields: List<Field<*>>? = null,
    ): PageResult<R> {
        val selectFields: Array<Field<*>> = fields?.toTypedArray() ?: pageRequest.table.fields()

        val query =
            if (distinct) {
                dsl.selectDistinct(*selectFields).from(pageRequest.table).where(pageRequest.filterConditions)
            } else {
                dsl.select(*selectFields).from(pageRequest.table).where(pageRequest.filterConditions)
            }

        val totalItems = dsl.fetchCount(query)
        val pagesTotal = (totalItems + pageRequest.pageSize - 1) / pageRequest.pageSize

        return when (pageRequest) {
            is FirstPageRequest -> getFirstPage(pagesTotal, pageRequest, query)
            is PreviousPageRequest -> getPreviousPage(pagesTotal, pageRequest, query)
            is NextPageRequest -> getNextPage(pagesTotal, pageRequest, query)
            is LastPageRequest -> getLastPage(pagesTotal, pageRequest, query)
            else -> throw IllegalArgumentException("Unsupported page request type: ${pageRequest::class.simpleName}")
        }
    }

    private fun <R : Record> getFirstPage(
        pagesTotal: Int,
        pageRequest: FirstPageRequest<R>,
        query: SelectConditionStep<out Record>,
    ): PageResult<R> {
        val orderByFields = pageRequest.orderFields
        val result =
            query
                .orderBy(
                    orderByFields.map { (field, order) -> field.applySortOrder(order) },
                ).limit(pageRequest.pageSize)
                .fetchInto(pageRequest.table.recordType)
        val lastItem = result.lastOrNull()
        val isLastPage = pagesTotal <= 1

        return PageResult(
            data = result,
            pagesTotal = pagesTotal,
            orderByFields = orderByFields.keys.toList(),
            after = if (isLastPage) null else lastItem,
            before = null,
        )
    }

    private fun <R : Record> getLastPage(
        pagesTotal: Int,
        pageRequest: LastPageRequest<R>,
        query: SelectConditionStep<out Record>,
    ): PageResult<R> {
        val orderByFields = pageRequest.orderFields
        val result =
            query
                .orderBy(
                    orderByFields.map { (field, order) -> field.applySortOrder(order.reversed()) },
                ).limit(pageRequest.pageSize + 1)
                .fetchInto(pageRequest.table.recordType)

        val lastItem = result.lastOrNull()
        val isLastPage = result.size <= pageRequest.pageSize
        val data = if (isLastPage) result.reversed() else result.dropLast(1).reversed()

        return PageResult(
            data = data,
            pagesTotal = pagesTotal,
            orderByFields = orderByFields.keys.toList(),
            after = null,
            before = if (isLastPage) null else lastItem,
        )
    }

    private fun <R : Record> getPreviousPage(
        pagesTotal: Int,
        pageRequest: PreviousPageRequest<R>,
        query: SelectConditionStep<out Record>,
    ): PageResult<R> {
        val cursorEntries = pageRequest.cursorFieldValues.entries.toList()
        val cursorFields = cursorEntries.map { it.key }
        val orderByFields = pageRequest.orderFields

        validateCursorFieldsMatchOrderByFields(cursorFields, orderByFields)

        val cursorValues = getCursorValuesInCorrectOrder(pageRequest.cursorFieldValues, orderByFields)

        val result =
            query
                .orderBy(
                    orderByFields.map { (field, order) -> field.applySortOrder(order.reversed()) },
                ).seekAfter(*cursorValues.toTypedArray())
                .limit(pageRequest.pageSize + 1)
                .fetchInto(pageRequest.table.recordType)

        val isFirstPage = result.size <= pageRequest.pageSize
        val data = if (isFirstPage) result.reversed() else result.dropLast(1).reversed() // Remove item over the limit
        val lastItem = data.lastOrNull()
        val firstItem = data.firstOrNull()

        return PageResult(
            data = data,
            pagesTotal = pagesTotal,
            orderByFields = orderByFields.keys.toList(),
            after = lastItem,
            before = if (isFirstPage) null else firstItem,
        )
    }

    private fun <R : Record> getNextPage(
        pagesTotal: Int,
        pageRequest: NextPageRequest<R>,
        query: SelectConditionStep<out Record>,
    ): PageResult<R> {
        val cursorEntries = pageRequest.cursorFieldValues.entries.toList()
        val cursorFields = cursorEntries.map { it.key }
        val orderByFields = pageRequest.orderFields

        validateCursorFieldsMatchOrderByFields(cursorFields, orderByFields)

        val cursorValues = getCursorValuesInCorrectOrder(pageRequest.cursorFieldValues, orderByFields)

        val result =
            query
                .orderBy(
                    orderByFields.map { (field, order) -> field.applySortOrder(order) },
                ).seek(*cursorValues.toTypedArray())
                .limit(pageRequest.pageSize + 1)
                .fetchInto(pageRequest.table.recordType)

        val isLastPage = result.size <= pageRequest.pageSize
        val data = if (isLastPage) result else result.dropLast(1) // Remove item over the limit
        val lastItem = data.lastOrNull()
        val firstItem = data.firstOrNull()

        return PageResult(
            data = data,
            pagesTotal = pagesTotal,
            orderByFields = orderByFields.keys.toList(),
            after = if (isLastPage) null else lastItem,
            before = firstItem,
        )
    }

    private fun validateCursorFieldsMatchOrderByFields(
        cursorFields: List<Field<*>>,
        orderByFields: Map<Field<*>, SortOrder>,
    ) {
        if (cursorFields.size != orderByFields.size ||
            !cursorFields.all { orderByFields.containsKey(it) }
        ) {
            throw PaginationException(PaginationErrorCode.INVALID_FIELDS)
        }
    }

    /**
     * Returns cursor values ordered to match the order of fields in the `orderByFields` map.
     *
     * This is required because jOOQ's `seek()` method expects the cursor values to align with
     * the order of the sort fields.
     */
    private fun getCursorValuesInCorrectOrder(
        cursorFieldValues: Map<Field<*>, Any>,
        orderByFields: Map<Field<*>, SortOrder>,
    ): List<Any> =
        orderByFields.map { field ->
            cursorFieldValues[field.key]
                ?: throw PaginationException(PaginationErrorCode.MISSING_CURSOR_VALUE, "Field ${field.key} is not in the cursor")
        }
}

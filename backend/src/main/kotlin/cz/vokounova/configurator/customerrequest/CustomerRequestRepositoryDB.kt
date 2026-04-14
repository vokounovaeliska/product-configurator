package cz.vokounova.configurator.customerrequest

import com.fasterxml.jackson.databind.ObjectMapper
import cz.vokounova.configurator.customerrequest.domain.CustomerRequest
import cz.vokounova.configurator.customerrequest.domain.CustomerRequestFilter
import cz.vokounova.configurator.customerrequest.domain.CustomerRequestId
import cz.vokounova.configurator.customerrequest.infrastructure.persistence.mapper.toDomain
import cz.vokounova.configurator.customerrequest.infrastructure.persistence.mapper.toPersistence
import cz.vokounova.configurator.customerrequest.ports.outbound.CustomerRequestRepository
import cz.vokounova.configurator.generated.jooq.enums.RequestStatus
import cz.vokounova.configurator.generated.jooq.tables.references.CUSTOMER_REQUEST
import cz.vokounova.configurator.generated.jooq.tables.references.PRODUCT_MODEL
import cz.vokounova.configurator.users.api.dto.UserIdDto
import org.jooq.DSLContext
import org.springframework.stereotype.Component
import java.time.OffsetDateTime

@Component
class CustomerRequestRepositoryDB(
    private val dslContext: DSLContext,
    private val objectMapper: ObjectMapper,
) : CustomerRequestRepository {
    override fun create(request: CustomerRequest): CustomerRequest? {
        val now = OffsetDateTime.now()
        val record = request.toPersistence(objectMapper, now, now)
        dslContext.insertInto(CUSTOMER_REQUEST).set(record).execute()
        return findById(CustomerRequestId(record.id))
    }

    override fun findById(id: CustomerRequestId): CustomerRequest? =
        dslContext
            .selectFrom(CUSTOMER_REQUEST)
            .where(CUSTOMER_REQUEST.ID.eq(id.value))
            .fetchOne()
            ?.toDomain(objectMapper)

    override fun updateStatus(
        id: CustomerRequestId,
        status: RequestStatus,
    ): CustomerRequest? {
        val updated =
            dslContext
                .update(CUSTOMER_REQUEST)
                .set(CUSTOMER_REQUEST.STATUS, status)
                .set(CUSTOMER_REQUEST.MODIFIED_AT, OffsetDateTime.now())
                .where(CUSTOMER_REQUEST.ID.eq(id.value))
                .execute()
        return findById(id).takeIf { updated > 0 }
    }

    override fun deleteById(id: CustomerRequestId): Boolean {
        val deleted =
            dslContext
                .deleteFrom(CUSTOMER_REQUEST)
                .where(CUSTOMER_REQUEST.ID.eq(id.value))
                .execute()
        return deleted > 0
    }

    override fun findByProductModelOwnerId(
        userId: UserIdDto,
        limit: Int,
        after: String?,
        filter: CustomerRequestFilter,
    ): List<CustomerRequest> {
        val ownerCondition =
            CUSTOMER_REQUEST.PRODUCT_MODEL_ID.`in`(
                dslContext.select(PRODUCT_MODEL.ID).from(PRODUCT_MODEL).where(PRODUCT_MODEL.USER_ID.eq(userId.value)),
            )
        var whereCondition = ownerCondition
        if (filter.productModelId != null) {
            whereCondition = whereCondition.and(CUSTOMER_REQUEST.PRODUCT_MODEL_ID.eq(filter.productModelId))
        }
        if (filter.fromDate != null) {
            whereCondition = whereCondition.and(CUSTOMER_REQUEST.CREATED_AT.greaterOrEqual(filter.fromDate))
        }
        if (filter.toDate != null) {
            whereCondition = whereCondition.and(CUSTOMER_REQUEST.CREATED_AT.lessOrEqual(filter.toDate))
        }
        if (after != null) {
            val afterTime =
                try {
                    OffsetDateTime.parse(after)
                } catch (_: Exception) {
                    return dslContext
                        .selectFrom(CUSTOMER_REQUEST)
                        .where(whereCondition)
                        .orderBy(CUSTOMER_REQUEST.CREATED_AT.desc())
                        .limit(limit)
                        .fetch()
                        .map { it.toDomain(objectMapper) }
                }
            whereCondition = whereCondition.and(CUSTOMER_REQUEST.CREATED_AT.lt(afterTime))
        }
        return dslContext
            .selectFrom(CUSTOMER_REQUEST)
            .where(whereCondition)
            .orderBy(CUSTOMER_REQUEST.CREATED_AT.desc())
            .limit(limit)
            .fetch()
            .map { it.toDomain(objectMapper) }
    }
}

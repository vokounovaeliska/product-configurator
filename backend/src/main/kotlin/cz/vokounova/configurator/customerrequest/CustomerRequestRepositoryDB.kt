package cz.vokounova.configurator.customerrequest

import com.fasterxml.jackson.databind.ObjectMapper
import cz.vokounova.configurator.customerrequest.domain.CustomerRequest
import cz.vokounova.configurator.customerrequest.domain.CustomerRequestId
import cz.vokounova.configurator.customerrequest.ports.outbound.CustomerRequestRepository
import cz.vokounova.configurator.generated.jooq.enums.RequestStatus
import cz.vokounova.configurator.generated.jooq.tables.references.CUSTOMER_REQUEST
import cz.vokounova.configurator.generated.jooq.tables.references.PRODUCT_MODEL
import cz.vokounova.configurator.users.api.dto.UserIdDto
import org.jooq.DSLContext
import org.jooq.JSONB
import org.jooq.impl.DSL
import org.jooq.impl.SQLDataType
import org.springframework.stereotype.Component
import java.time.OffsetDateTime

private val SNAPSHOT_IMAGE_BASE64_FIELD = DSL.field(DSL.name("snapshot_image_base64"), SQLDataType.CLOB)

@Component
class CustomerRequestRepositoryDB(
    private val dslContext: DSLContext,
    private val objectMapper: ObjectMapper,
) : CustomerRequestRepository {
    override fun create(request: CustomerRequest): CustomerRequest? {
        val now = OffsetDateTime.now()
        val id = request.id.value
        dslContext
            .insertInto(CUSTOMER_REQUEST)
            .set(CUSTOMER_REQUEST.ID, id)
            .set(CUSTOMER_REQUEST.STATUS, RequestStatus.NEW)
            .set(CUSTOMER_REQUEST.CUSTOMER_NAME, request.customerName)
            .set(CUSTOMER_REQUEST.CUSTOMER_EMAIL, request.customerEmail)
            .set(CUSTOMER_REQUEST.CUSTOMER_PHONE, request.customerPhone)
            .set(CUSTOMER_REQUEST.CUSTOMER_NOTE, request.customerNote)
            .set(CUSTOMER_REQUEST.PRODUCT_MODEL_ID, request.productModelId)
            .set(CUSTOMER_REQUEST.PRODUCT_MODEL_NAME, request.productModelName)
            .set(CUSTOMER_REQUEST.PRODUCT_MODEL_DESCRIPTION, request.productModelDescription)
            .set(CUSTOMER_REQUEST.CURRENCY, request.currency)
            .set(CUSTOMER_REQUEST.TOTAL_PRICE_CENTS, request.totalPriceCents)
            .set(
                CUSTOMER_REQUEST.CONFIGURATION_JSON,
                JSONB.valueOf(objectMapper.writeValueAsString(request.configurationJson)),
            ).set(
                CUSTOMER_REQUEST.PRICING_BREAKDOWN_JSON,
                request.pricingBreakdownJson?.let { JSONB.valueOf(objectMapper.writeValueAsString(it)) },
            ).set(SNAPSHOT_IMAGE_BASE64_FIELD, request.snapshotImageBase64)
            .set(CUSTOMER_REQUEST.CREATED_AT, now)
            .set(CUSTOMER_REQUEST.MODIFIED_AT, now)
            .execute()
        return findById(CustomerRequestId(id))
    }

    override fun findById(id: CustomerRequestId): CustomerRequest? {
        val record =
            dslContext
                .selectFrom(CUSTOMER_REQUEST)
                .where(CUSTOMER_REQUEST.ID.eq(id.value))
                .fetchOne()
                ?: return null
        return record.toDomain()
    }

    override fun findByProductModelOwnerId(
        userId: UserIdDto,
        limit: Int,
        after: String?,
    ): List<CustomerRequest> {
        val ownerCondition =
            CUSTOMER_REQUEST.PRODUCT_MODEL_ID.`in`(
                dslContext.select(PRODUCT_MODEL.ID).from(PRODUCT_MODEL).where(PRODUCT_MODEL.USER_ID.eq(userId.value)),
            )
        val whereCondition =
            if (after != null) {
                val afterTime =
                    try {
                        OffsetDateTime.parse(after)
                    } catch (_: Exception) {
                        return dslContext
                            .selectFrom(CUSTOMER_REQUEST)
                            .where(ownerCondition)
                            .orderBy(CUSTOMER_REQUEST.CREATED_AT.desc())
                            .limit(limit)
                            .fetch()
                            .map { it.toDomain() }
                    }
                ownerCondition.and(CUSTOMER_REQUEST.CREATED_AT.lt(afterTime))
            } else {
                ownerCondition
            }
        return dslContext
            .selectFrom(CUSTOMER_REQUEST)
            .where(whereCondition)
            .orderBy(CUSTOMER_REQUEST.CREATED_AT.desc())
            .limit(limit)
            .fetch()
            .map { it.toDomain() }
    }

    private fun org.jooq.Record.toDomain(): CustomerRequest {
        val record = this as cz.vokounova.configurator.generated.jooq.tables.records.CustomerRequestRecord
        val configJson = record.configurationJson.data()
        val configNode = objectMapper.readTree(configJson) ?: objectMapper.createObjectNode()
        val breakdownJson = record.pricingBreakdownJson?.data()
        val breakdownNode = if (breakdownJson != null) objectMapper.readTree(breakdownJson) else null
        val snapshotBase64 = record.get(SNAPSHOT_IMAGE_BASE64_FIELD)
        return CustomerRequest(
            id = CustomerRequestId(record.id),
            status = record.status ?: RequestStatus.NEW,
            customerName = record.customerName,
            customerEmail = record.customerEmail,
            customerPhone = record.customerPhone,
            customerNote = record.customerNote,
            productModelId = record.productModelId,
            productModelName = record.productModelName,
            productModelDescription = record.productModelDescription,
            currency = record.currency,
            totalPriceCents = record.totalPriceCents,
            configurationJson = configNode,
            pricingBreakdownJson = breakdownNode,
            snapshotImageBase64 = snapshotBase64,
            createdAt = record.createdAt,
            modifiedAt = record.modifiedAt,
        )
    }
}

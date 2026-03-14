package cz.vokounova.configurator.customerrequest.infrastructure.persistence.mapper

import com.fasterxml.jackson.databind.ObjectMapper
import cz.vokounova.configurator.customerrequest.domain.CustomerRequest
import cz.vokounova.configurator.customerrequest.domain.CustomerRequestId
import cz.vokounova.configurator.generated.jooq.enums.RequestStatus
import cz.vokounova.configurator.generated.jooq.tables.records.CustomerRequestRecord
import org.jooq.JSONB

fun CustomerRequest.toPersistence(
    objectMapper: ObjectMapper,
    createdAt: java.time.OffsetDateTime,
    modifiedAt: java.time.OffsetDateTime,
): CustomerRequestRecord =
    CustomerRequestRecord(
        id = id.value,
        status = status,
        customerName = customerName,
        customerEmail = customerEmail,
        customerPhone = customerPhone,
        customerNote = customerNote,
        productModelId = productModelId,
        productModelName = productModelName,
        productModelDescription = productModelDescription,
        currency = currency,
        totalPrice = totalPrice,
        configurationJson = JSONB.valueOf(objectMapper.writeValueAsString(configurationJson)),
        pricingBreakdownJson = pricingBreakdownJson?.let { JSONB.valueOf(objectMapper.writeValueAsString(it)) },
        createdAt = createdAt,
        modifiedAt = modifiedAt,
        snapshotImageBase64 = snapshotImageBase64,
    )

fun CustomerRequestRecord.toDomain(objectMapper: ObjectMapper): CustomerRequest {
    val configJson = configurationJson.data()
    val configNode = objectMapper.readTree(configJson) ?: objectMapper.createObjectNode()
    val breakdownJson = pricingBreakdownJson?.data()
    val breakdownNode = if (breakdownJson != null) objectMapper.readTree(breakdownJson) else null
    return CustomerRequest(
        id = CustomerRequestId(id),
        status = status ?: RequestStatus.NEW,
        customerName = customerName,
        customerEmail = customerEmail,
        customerPhone = customerPhone,
        customerNote = customerNote,
        productModelId = productModelId,
        productModelName = productModelName,
        productModelDescription = productModelDescription,
        currency = currency,
        totalPrice = totalPrice,
        configurationJson = configNode,
        pricingBreakdownJson = breakdownNode,
        snapshotImageBase64 = snapshotImageBase64,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
    )
}

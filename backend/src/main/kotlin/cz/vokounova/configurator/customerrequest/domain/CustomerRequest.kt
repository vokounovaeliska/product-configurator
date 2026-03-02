package cz.vokounova.configurator.customerrequest.domain

import com.fasterxml.jackson.databind.JsonNode
import cz.vokounova.configurator.generated.jooq.enums.RequestStatus
import java.time.OffsetDateTime
import java.util.UUID

@JvmInline
value class CustomerRequestId(val value: UUID)

data class CustomerRequest(
    val id: CustomerRequestId,
    val status: RequestStatus,
    val customerName: String?,
    val customerEmail: String,
    val customerPhone: String?,
    val customerNote: String?,
    val productModelId: UUID?,
    val productModelName: String,
    val productModelDescription: String?,
    val currency: String,
    val totalPriceCents: Int,
    val configurationJson: JsonNode,
    val pricingBreakdownJson: JsonNode?,
    val snapshotImageBase64: String?,
    val createdAt: OffsetDateTime,
    val modifiedAt: OffsetDateTime,
)

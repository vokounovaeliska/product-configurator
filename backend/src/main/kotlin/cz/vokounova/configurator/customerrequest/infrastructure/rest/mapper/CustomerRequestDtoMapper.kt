package cz.vokounova.configurator.customerrequest.infrastructure.rest.mapper

import com.fasterxml.jackson.databind.JsonNode
import cz.vokounova.configurator.customerrequest.domain.CustomerRequest
import java.time.OffsetDateTime
import java.util.UUID

data class CustomerRequestDto(
    val id: UUID,
    val status: String,
    val customerName: String?,
    val customerEmail: String,
    val customerPhone: String?,
    val customerNote: String?,
    val productModelId: UUID?,
    val productModelName: String,
    val productModelDescription: String?,
    val currency: String,
    val totalPrice: Int,
    val configurationJson: JsonNode,
    val pricingBreakdownJson: JsonNode?,
    val snapshotImageBase64: String?,
    val createdAt: OffsetDateTime,
    val modifiedAt: OffsetDateTime,
)

fun CustomerRequest.toDto(): CustomerRequestDto =
    CustomerRequestDto(
        id = id.value,
        status = status.name,
        customerName = customerName,
        customerEmail = customerEmail,
        customerPhone = customerPhone,
        customerNote = customerNote,
        productModelId = productModelId,
        productModelName = productModelName,
        productModelDescription = productModelDescription,
        currency = currency,
        totalPrice = totalPrice,
        configurationJson = configurationJson,
        pricingBreakdownJson = pricingBreakdownJson,
        snapshotImageBase64 = snapshotImageBase64,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
    )

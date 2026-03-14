package cz.vokounova.configurator.embed.infrastructure.rest.mapper

import com.fasterxml.jackson.databind.JsonNode
import cz.vokounova.configurator.customerrequest.domain.CustomerRequest
import cz.vokounova.configurator.customerrequest.domain.CustomerRequestCreateParams
import java.util.UUID

data class CustomerRequestCreateRequestDto(
    val customerName: String?,
    val customerEmail: String,
    val customerPhone: String?,
    val customerNote: String?,
    val productModelId: UUID,
    val productModelName: String,
    val productModelDescription: String?,
    val currency: String,
    val totalPrice: Int,
    val configurationJson: JsonNode,
    val pricingBreakdownJson: JsonNode?,
    val snapshotImageBase64: String?,
)

data class CustomerRequestEmbedDto(
    val id: UUID,
    val status: String,
)

fun CustomerRequestCreateRequestDto.toCreateParams(): CustomerRequestCreateParams =
    CustomerRequestCreateParams(
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
    )

fun CustomerRequest.toEmbedDto(): CustomerRequestEmbedDto =
    CustomerRequestEmbedDto(
        id = id.value,
        status = status.name,
    )

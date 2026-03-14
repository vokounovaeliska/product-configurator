package cz.vokounova.configurator.customerrequest.api.dto

import com.fasterxml.jackson.databind.JsonNode
import java.util.UUID

data class CustomerRequestCreateDto(
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

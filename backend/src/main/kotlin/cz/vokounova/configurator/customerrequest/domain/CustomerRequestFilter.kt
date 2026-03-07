package cz.vokounova.configurator.customerrequest.domain

import java.time.OffsetDateTime
import java.util.UUID

data class CustomerRequestFilter(
    val productModelId: UUID? = null,
    val fromDate: OffsetDateTime? = null,
    val toDate: OffsetDateTime? = null,
)

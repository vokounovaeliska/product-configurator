package cz.vokounova.configurator.customerrequest.api.dto

import java.util.UUID

data class CustomerRequestResultDto(
    val id: UUID,
    val status: String,
)

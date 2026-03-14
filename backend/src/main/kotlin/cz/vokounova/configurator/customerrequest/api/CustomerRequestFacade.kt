package cz.vokounova.configurator.customerrequest.api

import cz.vokounova.configurator.customerrequest.api.dto.CustomerRequestCreateDto
import cz.vokounova.configurator.customerrequest.api.dto.CustomerRequestResultDto

interface CustomerRequestFacade {
    fun create(dto: CustomerRequestCreateDto): CustomerRequestResultDto
}

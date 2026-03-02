package cz.vokounova.configurator.customerrequest.ports.inbound

import cz.vokounova.configurator.customerrequest.domain.CustomerRequest
import cz.vokounova.configurator.customerrequest.domain.CustomerRequestCreateParams
import cz.vokounova.configurator.customerrequest.domain.CustomerRequestId
import cz.vokounova.configurator.users.api.dto.UserIdDto

interface CustomerRequestAPI {
    fun create(params: CustomerRequestCreateParams): CustomerRequest

    fun getById(id: CustomerRequestId): CustomerRequest

    fun listByProductModelOwner(
        userId: UserIdDto,
        limit: Int,
        after: String?,
    ): List<CustomerRequest>
}

package cz.vokounova.configurator.customerrequest.ports.outbound

import cz.vokounova.configurator.customerrequest.domain.CustomerRequest
import cz.vokounova.configurator.customerrequest.domain.CustomerRequestId
import cz.vokounova.configurator.users.api.dto.UserIdDto

interface CustomerRequestRepository {
    fun create(request: CustomerRequest): CustomerRequest?

    fun findById(id: CustomerRequestId): CustomerRequest?

    fun findByProductModelOwnerId(
        userId: UserIdDto,
        limit: Int,
        after: String?,
    ): List<CustomerRequest>
}

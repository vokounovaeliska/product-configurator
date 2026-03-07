package cz.vokounova.configurator.customerrequest.ports.inbound

import cz.vokounova.configurator.customerrequest.domain.CustomerRequest
import cz.vokounova.configurator.customerrequest.domain.CustomerRequestCreateParams
import cz.vokounova.configurator.customerrequest.domain.CustomerRequestFilter
import cz.vokounova.configurator.customerrequest.domain.CustomerRequestId
import cz.vokounova.configurator.generated.jooq.enums.RequestStatus
import cz.vokounova.configurator.users.api.dto.UserIdDto

interface CustomerRequestAPI {
    fun create(params: CustomerRequestCreateParams): CustomerRequest

    fun getById(id: CustomerRequestId): CustomerRequest

    fun updateStatus(
        userId: UserIdDto,
        id: CustomerRequestId,
        status: RequestStatus,
    ): CustomerRequest

    fun listByProductModelOwner(
        userId: UserIdDto,
        limit: Int,
        after: String?,
        filter: CustomerRequestFilter,
    ): List<CustomerRequest>
}

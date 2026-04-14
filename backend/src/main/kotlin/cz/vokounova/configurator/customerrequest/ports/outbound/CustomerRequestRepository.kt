package cz.vokounova.configurator.customerrequest.ports.outbound

import cz.vokounova.configurator.customerrequest.domain.CustomerRequest
import cz.vokounova.configurator.customerrequest.domain.CustomerRequestFilter
import cz.vokounova.configurator.customerrequest.domain.CustomerRequestId
import cz.vokounova.configurator.generated.jooq.enums.RequestStatus
import cz.vokounova.configurator.users.api.dto.UserIdDto

interface CustomerRequestRepository {
    fun create(request: CustomerRequest): CustomerRequest?

    fun findById(id: CustomerRequestId): CustomerRequest?

    fun updateStatus(
        id: CustomerRequestId,
        status: RequestStatus,
    ): CustomerRequest?

    /** @return true if a row was deleted */
    fun deleteById(id: CustomerRequestId): Boolean

    fun findByProductModelOwnerId(
        userId: UserIdDto,
        limit: Int,
        after: String?,
        filter: CustomerRequestFilter,
    ): List<CustomerRequest>
}

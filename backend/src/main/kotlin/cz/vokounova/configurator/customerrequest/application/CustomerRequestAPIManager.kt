package cz.vokounova.configurator.customerrequest.application

import cz.vokounova.configurator.customerrequest.domain.CustomerRequest
import cz.vokounova.configurator.customerrequest.domain.CustomerRequestCreateParams
import cz.vokounova.configurator.customerrequest.domain.CustomerRequestFilter
import cz.vokounova.configurator.customerrequest.domain.CustomerRequestId
import cz.vokounova.configurator.customerrequest.ports.inbound.CustomerRequestAPI
import cz.vokounova.configurator.customerrequest.ports.outbound.CustomerRequestRepository
import cz.vokounova.configurator.generated.jooq.enums.RequestStatus
import cz.vokounova.configurator.products.api.ProductConfigQueryFacade
import cz.vokounova.configurator.shared.exceptions.ResourceNotFoundException
import cz.vokounova.configurator.users.api.dto.UserIdDto
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.ports.inbound.UserAPI
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime
import java.util.UUID

@Component
class CustomerRequestAPIManager(
    private val customerRequestRepository: CustomerRequestRepository,
    private val productConfigQueryFacade: ProductConfigQueryFacade,
    private val emailNotificationService: CustomerRequestEmailNotificationService,
    private val userAPI: UserAPI,
) : CustomerRequestAPI {
    @Transactional
    override fun create(params: CustomerRequestCreateParams): CustomerRequest {
        if (!productConfigQueryFacade.isProductPublished(params.productModelId)) {
            throw IllegalArgumentException("Product is not published for embed")
        }
        val now = OffsetDateTime.now()
        val request =
            CustomerRequest(
                id = CustomerRequestId(UUID.randomUUID()),
                status = RequestStatus.NEW,
                customerName = params.customerName,
                customerEmail = params.customerEmail,
                customerPhone = params.customerPhone,
                customerNote = params.customerNote,
                productModelId = params.productModelId,
                productModelName = params.productModelName,
                productModelDescription = params.productModelDescription,
                currency = params.currency,
                totalPriceCents = params.totalPriceCents,
                configurationJson = params.configurationJson,
                pricingBreakdownJson = params.pricingBreakdownJson,
                snapshotImageBase64 = params.snapshotImageBase64,
                createdAt = now,
                modifiedAt = now,
            )
        val created =
            customerRequestRepository.create(request)
                ?: throw IllegalStateException("Failed to create customer request")
        val ownerId = productConfigQueryFacade.getProductOwnerId(params.productModelId)
        val owner = userAPI.getOne(UserId(ownerId))
        val supplierEmail = owner.supplierNotificationEmail ?: owner.email

        emailNotificationService.sendConfirmationEmail(created, replyTo = supplierEmail)
        emailNotificationService.sendSupplierNotification(created, supplierEmail = supplierEmail)
        return created
    }

    override fun getById(id: CustomerRequestId): CustomerRequest =
        customerRequestRepository.findById(id)
            ?: throw ResourceNotFoundException("Customer request not found")

    @Transactional
    override fun updateStatus(
        userId: UserIdDto,
        id: CustomerRequestId,
        status: RequestStatus,
    ): CustomerRequest {
        val userRequests =
            customerRequestRepository.findByProductModelOwnerId(userId, 1000, null, CustomerRequestFilter())
        if (!userRequests.any { it.id.value == id.value }) {
            throw ResourceNotFoundException("Customer request not found")
        }
        return customerRequestRepository.updateStatus(id, status)
            ?: throw ResourceNotFoundException("Customer request not found")
    }

    override fun listByProductModelOwner(
        userId: UserIdDto,
        limit: Int,
        after: String?,
        filter: CustomerRequestFilter,
    ): List<CustomerRequest> = customerRequestRepository.findByProductModelOwnerId(userId, limit, after, filter)
}

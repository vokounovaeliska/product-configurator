package cz.vokounova.configurator.customerrequest.infrastructure.rest

import cz.vokounova.configurator.customerrequest.application.CustomerRequestAPIManager
import cz.vokounova.configurator.customerrequest.domain.CustomerRequestFilter
import cz.vokounova.configurator.customerrequest.domain.CustomerRequestId
import cz.vokounova.configurator.customerrequest.infrastructure.rest.dto.UpdateStatusRequest
import cz.vokounova.configurator.customerrequest.infrastructure.rest.mapper.CustomerRequestDto
import cz.vokounova.configurator.customerrequest.infrastructure.rest.mapper.toDto
import cz.vokounova.configurator.generated.jooq.enums.RequestStatus
import cz.vokounova.configurator.shared.security.AuthFacade
import cz.vokounova.configurator.users.api.dto.UserIdDto
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.UUID

@Tag(
    name = "Customer requests",
    description = "Leads and quote requests tied to the authenticated seller’s product models: list, fetch by id, and update status.",
)
@RestController
@RequestMapping("/products/api/v1/customer-requests")
class CustomerRequestsController(
    private val customerRequestAPI: CustomerRequestAPIManager,
    private val authFacade: AuthFacade,
) {
    @Operation(
        summary = "Get customer request",
        description = "Returns a request if it belongs to a product model owned by the current user.",
    )
    @GetMapping("/{id}")
    fun getById(
        @PathVariable id: UUID,
    ): ResponseEntity<CustomerRequestDto> {
        val request = customerRequestAPI.getById(CustomerRequestId(id))
        val userId = UserIdDto(authFacade.getCurrentAuthDetails().id().value)
        // Only return if user owns a product model matching this request
        val userRequests =
            customerRequestAPI.listByProductModelOwner(userId, 1000, null, CustomerRequestFilter())
        if (!userRequests.any { it.id.value == id }) return ResponseEntity.notFound().build()
        return ResponseEntity.ok(request.toDto())
    }

    @GetMapping
    fun list(
        @RequestParam(defaultValue = "20") limit: Int,
        @RequestParam(required = false) after: String?,
        @RequestParam(required = false) productModelId: UUID?,
        @RequestParam(required = false) fromDate: LocalDate?,
        @RequestParam(required = false) toDate: LocalDate?,
    ): ResponseEntity<List<CustomerRequestDto>> {
        val userId = UserIdDto(authFacade.getCurrentAuthDetails().id().value)
        val filter =
            CustomerRequestFilter(
                productModelId = productModelId,
                fromDate = fromDate?.atStartOfDay(ZoneOffset.UTC)?.toOffsetDateTime(),
                toDate = toDate?.atTime(23, 59, 59, 999_999_999)?.atZone(ZoneOffset.UTC)?.toOffsetDateTime(),
            )
        val requests =
            customerRequestAPI.listByProductModelOwner(userId, limit.coerceIn(1, 100), after, filter)
        return ResponseEntity.ok(requests.map { it.toDto() })
    }

    @Operation(
        summary = "Update request status",
        description = "Sets workflow status (e.g. new, contacted) for a request the seller owns.",
    )
    @PatchMapping("/{id}/status")
    fun updateStatus(
        @PathVariable id: UUID,
        @RequestBody body: UpdateStatusRequest,
    ): ResponseEntity<CustomerRequestDto> {
        val status =
            RequestStatus.entries.find { it.name == body.status }
                ?: throw IllegalArgumentException("Invalid status: ${body.status}")
        val userId = UserIdDto(authFacade.getCurrentAuthDetails().id().value)
        val updated = customerRequestAPI.updateStatus(userId, CustomerRequestId(id), status)
        return ResponseEntity.ok(updated.toDto())
    }
}

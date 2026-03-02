package cz.vokounova.configurator.customerrequest.infrastructure.rest

import cz.vokounova.configurator.customerrequest.application.CustomerRequestAPIManager
import cz.vokounova.configurator.customerrequest.domain.CustomerRequestId
import cz.vokounova.configurator.customerrequest.infrastructure.rest.mapper.CustomerRequestDto
import cz.vokounova.configurator.customerrequest.infrastructure.rest.mapper.toDto
import cz.vokounova.configurator.shared.security.AuthFacade
import cz.vokounova.configurator.users.api.dto.UserIdDto
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/products/api/v1/customer-requests")
class CustomerRequestsController(
    private val customerRequestAPI: CustomerRequestAPIManager,
    private val authFacade: AuthFacade,
) {
    @GetMapping("/{id}")
    fun getById(
        @PathVariable id: UUID,
    ): ResponseEntity<CustomerRequestDto> {
        val request = customerRequestAPI.getById(CustomerRequestId(id))
        val userId = UserIdDto(authFacade.getCurrentAuthDetails().id().value)
        // Only return if user owns a product model matching this request
        val userRequests = customerRequestAPI.listByProductModelOwner(userId, 1000, null)
        if (!userRequests.any { it.id.value == id }) return ResponseEntity.notFound().build()
        return ResponseEntity.ok(request.toDto())
    }

    @GetMapping
    fun list(
        @RequestParam(defaultValue = "20") limit: Int,
        @RequestParam(required = false) after: String?,
    ): ResponseEntity<List<CustomerRequestDto>> {
        val userId = UserIdDto(authFacade.getCurrentAuthDetails().id().value)
        val requests = customerRequestAPI.listByProductModelOwner(userId, limit.coerceIn(1, 100), after)
        return ResponseEntity.ok(requests.map { it.toDto() })
    }
}

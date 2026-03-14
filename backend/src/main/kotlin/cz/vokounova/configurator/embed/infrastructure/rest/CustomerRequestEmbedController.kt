package cz.vokounova.configurator.embed.infrastructure.rest

import cz.vokounova.configurator.customerrequest.api.CustomerRequestFacade
import cz.vokounova.configurator.customerrequest.api.dto.CustomerRequestCreateDto
import cz.vokounova.configurator.customerrequest.api.dto.CustomerRequestResultDto
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * Public embed API – customer request creation (no auth).
 */
@RestController
@RequestMapping("/embed/api/v1")
class CustomerRequestEmbedController(
    private val customerRequestFacade: CustomerRequestFacade,
) {
    @PostMapping("/customer-requests")
    fun createCustomerRequest(
        @RequestBody body: CustomerRequestCreateDto,
    ): ResponseEntity<CustomerRequestResultDto> {
        val result = customerRequestFacade.create(body)
        return ResponseEntity.status(HttpStatus.CREATED).body(result)
    }
}

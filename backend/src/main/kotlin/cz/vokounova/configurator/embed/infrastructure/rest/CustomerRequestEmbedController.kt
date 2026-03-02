package cz.vokounova.configurator.embed.infrastructure.rest

import cz.vokounova.configurator.customerrequest.application.CustomerRequestAPIManager
import cz.vokounova.configurator.embed.infrastructure.rest.mapper.CustomerRequestCreateRequestDto
import cz.vokounova.configurator.embed.infrastructure.rest.mapper.CustomerRequestEmbedDto
import cz.vokounova.configurator.embed.infrastructure.rest.mapper.toCreateParams
import cz.vokounova.configurator.embed.infrastructure.rest.mapper.toEmbedDto
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
    private val customerRequestAPI: CustomerRequestAPIManager,
) {
    @PostMapping("/customer-requests")
    fun createCustomerRequest(
        @RequestBody body: CustomerRequestCreateRequestDto,
    ): ResponseEntity<CustomerRequestEmbedDto> {
        val params = body.toCreateParams()
        val created = customerRequestAPI.create(params)
        return ResponseEntity.status(HttpStatus.CREATED).body(created.toEmbedDto())
    }
}

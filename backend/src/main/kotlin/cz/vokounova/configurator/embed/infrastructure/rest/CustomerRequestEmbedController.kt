package cz.vokounova.configurator.embed.infrastructure.rest

import cz.vokounova.configurator.customerrequest.api.CustomerRequestFacade
import cz.vokounova.configurator.customerrequest.api.dto.CustomerRequestCreateDto
import cz.vokounova.configurator.customerrequest.api.dto.CustomerRequestResultDto
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(
    name = "Public embed",
    description = "Unauthenticated APIs for the embedded configurator: published product config and customer lead submission.",
)
@RestController
@RequestMapping("/embed/api/v1")
class CustomerRequestEmbedController(
    private val customerRequestFacade: CustomerRequestFacade,
) {
    @Operation(
        summary = "Submit customer request from embed",
        description = "Creates a lead / quote request from the public embed (no login).",
    )
    @PostMapping("/customer-requests")
    fun createCustomerRequest(
        @RequestBody body: CustomerRequestCreateDto,
    ): ResponseEntity<CustomerRequestResultDto> {
        val result = customerRequestFacade.create(body)
        return ResponseEntity.status(HttpStatus.CREATED).body(result)
    }
}

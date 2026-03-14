package cz.vokounova.configurator.customerrequest.application

import cz.vokounova.configurator.customerrequest.api.CustomerRequestFacade
import cz.vokounova.configurator.customerrequest.api.dto.CustomerRequestCreateDto
import cz.vokounova.configurator.customerrequest.api.dto.CustomerRequestResultDto
import cz.vokounova.configurator.customerrequest.domain.CustomerRequestCreateParams
import cz.vokounova.configurator.customerrequest.ports.inbound.CustomerRequestAPI
import org.springframework.stereotype.Service

@Service
class CustomerRequestFacadeService(
    private val customerRequestAPI: CustomerRequestAPI,
) : CustomerRequestFacade {
    override fun create(dto: CustomerRequestCreateDto): CustomerRequestResultDto {
        val params =
            CustomerRequestCreateParams(
                customerName = dto.customerName,
                customerEmail = dto.customerEmail,
                customerPhone = dto.customerPhone,
                customerNote = dto.customerNote,
                productModelId = dto.productModelId,
                productModelName = dto.productModelName,
                productModelDescription = dto.productModelDescription,
                currency = dto.currency,
                totalPrice = dto.totalPrice,
                configurationJson = dto.configurationJson,
                pricingBreakdownJson = dto.pricingBreakdownJson,
                snapshotImageBase64 = dto.snapshotImageBase64,
            )
        val created = customerRequestAPI.create(params)
        return CustomerRequestResultDto(
            id = created.id.value,
            status = created.status.name,
        )
    }
}

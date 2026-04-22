package cz.vokounova.configurator.products.models.application

import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.products.models.ports.inbound.ProductModelAPI
import cz.vokounova.configurator.shared.security.AuthFacade
import cz.vokounova.configurator.users.api.dto.UserIdDto
import org.springframework.stereotype.Component
import java.util.UUID

@Component
class ProductModelAccessGuard(
    private val productModelAPI: ProductModelAPI,
    private val authFacade: AuthFacade,
) {
    fun currentUserId(): UserIdDto = UserIdDto(authFacade.getCurrentAuthDetails().id().value)

    fun requireCurrentUserOwnsProductModel(productModelId: UUID) {
        productModelAPI.getOneForUser(ProductModelId(productModelId), currentUserId())
    }
}

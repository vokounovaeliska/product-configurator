package cz.vokounova.configurator.products.models.application

import cz.vokounova.configurator.products.models.domain.ProductModelConfiguratorPreferences
import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.products.models.ports.inbound.ProductModelConfiguratorPreferencesAPI
import cz.vokounova.configurator.products.models.ports.outbound.ProductModelConfiguratorPreferencesRepository
import cz.vokounova.configurator.products.models.ports.outbound.ProductModelRepository
import cz.vokounova.configurator.shared.exceptions.ResourceNotFoundException
import cz.vokounova.configurator.shared.security.AuthFacade
import cz.vokounova.configurator.users.api.dto.UserIdDto
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.OffsetDateTime

@Service
class ProductModelConfiguratorPreferencesAPIManager(
    private val repository: ProductModelConfiguratorPreferencesRepository,
    private val productModelRepository: ProductModelRepository,
    private val authFacade: AuthFacade,
) : ProductModelConfiguratorPreferencesAPI {
    override fun getByProductModelId(productModelId: ProductModelId): ProductModelConfiguratorPreferences? =
        repository.findByProductModelId(productModelId)

    override fun getByProductModelIdForCurrentUser(productModelId: ProductModelId): ProductModelConfiguratorPreferences? {
        val productModel = productModelRepository.findById(productModelId, lock = false) ?: return null
        val currentUserId = UserIdDto(authFacade.getCurrentAuthDetails().id().value)
        if (productModel.userId != currentUserId) return null
        return repository.findByProductModelId(productModelId)
    }

    @Transactional
    override fun upsert(
        productModelId: ProductModelId,
        zoomDistanceDefault: Double?,
        zoomDistanceEmbed: Double?,
        embedShowProductName: Boolean?,
        embedShowDescription: Boolean?,
        embedShowComponents: Boolean?,
    ): ProductModelConfiguratorPreferences {
        val productModel =
            productModelRepository.findById(productModelId, lock = false)
                ?: throw ResourceNotFoundException("Product model not found")

        val currentUserId = UserIdDto(authFacade.getCurrentAuthDetails().id().value)
        if (productModel.userId != currentUserId) {
            throw ResourceNotFoundException("Product model not found")
        }

        val existing = repository.findByProductModelId(productModelId)
        val now = OffsetDateTime.now()
        val preferences =
            ProductModelConfiguratorPreferences(
                productModelId = productModelId,
                zoomDistanceDefault =
                    zoomDistanceDefault?.let { BigDecimal.valueOf(it) }
                        ?: existing?.zoomDistanceDefault,
                zoomDistanceEmbed =
                    zoomDistanceEmbed?.let { BigDecimal.valueOf(it) }
                        ?: existing?.zoomDistanceEmbed,
                embedShowProductName = embedShowProductName ?: existing?.embedShowProductName,
                embedShowDescription = embedShowDescription ?: existing?.embedShowDescription,
                embedShowComponents = embedShowComponents ?: existing?.embedShowComponents,
                createdAt = existing?.createdAt ?: now,
                modifiedAt = now,
            )
        return repository.upsert(preferences)
    }
}

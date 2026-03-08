package cz.vokounova.configurator.products.models.ports.outbound

import cz.vokounova.configurator.products.models.domain.ProductModelConfiguratorPreferences
import cz.vokounova.configurator.products.models.domain.ProductModelId

interface ProductModelConfiguratorPreferencesRepository {
    fun findByProductModelId(productModelId: ProductModelId): ProductModelConfiguratorPreferences?

    fun upsert(preferences: ProductModelConfiguratorPreferences): ProductModelConfiguratorPreferences
}

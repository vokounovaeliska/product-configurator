package cz.vokounova.configurator.products.models

import cz.vokounova.configurator.generated.jooq.tables.references.PRODUCT_MODEL_CONFIGURATOR_PREFERENCES
import cz.vokounova.configurator.products.models.domain.ProductModelConfiguratorPreferences
import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.products.models.infrastructure.persistence.mapper.toDomain
import cz.vokounova.configurator.products.models.infrastructure.persistence.mapper.toPersistence
import cz.vokounova.configurator.products.models.ports.outbound.ProductModelConfiguratorPreferencesRepository
import org.springframework.stereotype.Component
import java.time.OffsetDateTime

@Component
class ProductModelConfiguratorPreferencesRepositoryDB(
    private val dslContext: org.jooq.DSLContext,
) : ProductModelConfiguratorPreferencesRepository {
    override fun findByProductModelId(productModelId: ProductModelId): ProductModelConfiguratorPreferences? =
        dslContext
            .selectFrom(PRODUCT_MODEL_CONFIGURATOR_PREFERENCES)
            .where(PRODUCT_MODEL_CONFIGURATOR_PREFERENCES.PRODUCT_MODEL_ID.eq(productModelId.value))
            .fetchOne()
            ?.toDomain()

    override fun upsert(preferences: ProductModelConfiguratorPreferences): ProductModelConfiguratorPreferences {
        val now = OffsetDateTime.now()
        val record = preferences.toPersistence(now, now)
        dslContext
            .insertInto(PRODUCT_MODEL_CONFIGURATOR_PREFERENCES)
            .set(record)
            .onConflict(PRODUCT_MODEL_CONFIGURATOR_PREFERENCES.PRODUCT_MODEL_ID)
            .doUpdate()
            .set(record)
            .execute()
        return findByProductModelId(preferences.productModelId)
            ?: preferences.copy(modifiedAt = now)
    }
}

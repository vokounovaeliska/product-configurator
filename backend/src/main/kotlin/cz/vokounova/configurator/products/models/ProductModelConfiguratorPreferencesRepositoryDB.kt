package cz.vokounova.configurator.products.models

import cz.vokounova.configurator.generated.jooq.tables.references.PRODUCT_MODEL_CONFIGURATOR_PREFERENCES
import cz.vokounova.configurator.products.models.domain.ProductModelConfiguratorPreferences
import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.products.models.ports.outbound.ProductModelConfiguratorPreferencesRepository
import org.jooq.impl.DSL
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
        val backgroundPresetField = DSL.field(DSL.name("background_preset"), String::class.java)
        dslContext
            .insertInto(PRODUCT_MODEL_CONFIGURATOR_PREFERENCES)
            .columns(
                PRODUCT_MODEL_CONFIGURATOR_PREFERENCES.PRODUCT_MODEL_ID,
                PRODUCT_MODEL_CONFIGURATOR_PREFERENCES.ZOOM_DISTANCE_DEFAULT,
                PRODUCT_MODEL_CONFIGURATOR_PREFERENCES.ZOOM_DISTANCE_EMBED,
                PRODUCT_MODEL_CONFIGURATOR_PREFERENCES.EMBED_SHOW_PRODUCT_NAME,
                PRODUCT_MODEL_CONFIGURATOR_PREFERENCES.EMBED_SHOW_DESCRIPTION,
                PRODUCT_MODEL_CONFIGURATOR_PREFERENCES.EMBED_SHOW_COMPONENTS,
                backgroundPresetField,
                PRODUCT_MODEL_CONFIGURATOR_PREFERENCES.CREATED_AT,
                PRODUCT_MODEL_CONFIGURATOR_PREFERENCES.MODIFIED_AT,
            )
            .values(
                preferences.productModelId.value,
                preferences.zoomDistanceDefault,
                preferences.zoomDistanceEmbed,
                preferences.embedShowProductName,
                preferences.embedShowDescription,
                preferences.embedShowComponents,
                preferences.backgroundPreset,
                now,
                now,
            )
            .onConflict(PRODUCT_MODEL_CONFIGURATOR_PREFERENCES.PRODUCT_MODEL_ID)
            .doUpdate()
            .set(PRODUCT_MODEL_CONFIGURATOR_PREFERENCES.ZOOM_DISTANCE_DEFAULT, preferences.zoomDistanceDefault)
            .set(PRODUCT_MODEL_CONFIGURATOR_PREFERENCES.ZOOM_DISTANCE_EMBED, preferences.zoomDistanceEmbed)
            .set(PRODUCT_MODEL_CONFIGURATOR_PREFERENCES.EMBED_SHOW_PRODUCT_NAME, preferences.embedShowProductName)
            .set(PRODUCT_MODEL_CONFIGURATOR_PREFERENCES.EMBED_SHOW_DESCRIPTION, preferences.embedShowDescription)
            .set(PRODUCT_MODEL_CONFIGURATOR_PREFERENCES.EMBED_SHOW_COMPONENTS, preferences.embedShowComponents)
            .set(backgroundPresetField, preferences.backgroundPreset)
            .set(PRODUCT_MODEL_CONFIGURATOR_PREFERENCES.MODIFIED_AT, now)
            .execute()

        return findByProductModelId(preferences.productModelId)
            ?: preferences.copy(modifiedAt = now)
    }

    private fun org.jooq.Record.toDomain(): ProductModelConfiguratorPreferences {
        val r = this as cz.vokounova.configurator.generated.jooq.tables.records.ProductModelConfiguratorPreferencesRecord
        val backgroundPreset = r.get("background_preset", String::class.java)
        return ProductModelConfiguratorPreferences(
            productModelId = ProductModelId(r.productModelId),
            zoomDistanceDefault = r.zoomDistanceDefault,
            zoomDistanceEmbed = r.zoomDistanceEmbed,
            embedShowProductName = r.embedShowProductName,
            embedShowDescription = r.embedShowDescription,
            embedShowComponents = r.embedShowComponents,
            backgroundPreset = backgroundPreset,
            createdAt = r.createdAt,
            modifiedAt = r.modifiedAt,
        )
    }
}

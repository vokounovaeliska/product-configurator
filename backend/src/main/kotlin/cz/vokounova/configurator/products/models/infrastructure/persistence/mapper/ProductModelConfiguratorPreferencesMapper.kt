package cz.vokounova.configurator.products.models.infrastructure.persistence.mapper

import cz.vokounova.configurator.generated.jooq.tables.records.ProductModelConfiguratorPreferencesRecord
import cz.vokounova.configurator.products.models.domain.ProductModelConfiguratorPreferences
import cz.vokounova.configurator.products.models.domain.ProductModelId
import java.time.OffsetDateTime

fun ProductModelConfiguratorPreferences.toPersistence(
    createdAt: OffsetDateTime,
    modifiedAt: OffsetDateTime,
): ProductModelConfiguratorPreferencesRecord =
    ProductModelConfiguratorPreferencesRecord(
        productModelId = productModelId.value,
        zoomDistanceDefault = zoomDistanceDefault,
        zoomDistanceEmbed = zoomDistanceEmbed,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
        embedShowProductName = embedShowProductName,
        embedShowDescription = embedShowDescription,
        embedShowComponents = embedShowComponents,
        backgroundPreset = backgroundPreset,
    )

fun ProductModelConfiguratorPreferencesRecord.toDomain(): ProductModelConfiguratorPreferences =
    ProductModelConfiguratorPreferences(
        productModelId = ProductModelId(productModelId),
        zoomDistanceDefault = zoomDistanceDefault,
        zoomDistanceEmbed = zoomDistanceEmbed,
        embedShowProductName = embedShowProductName,
        embedShowDescription = embedShowDescription,
        embedShowComponents = embedShowComponents,
        backgroundPreset = backgroundPreset,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
    )

package cz.vokounova.configurator.shared.seeding

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties("seeding")
data class SeedingConfigProperties(
    val users: SeedingSourceConfig = SeedingSourceConfig(),
) {
    data class SeedingSourceConfig(
        val enabled: Boolean = false,
    )
}

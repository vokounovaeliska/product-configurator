package cz.vokounova.configurator.analytics.domain

import java.time.OffsetDateTime
import java.time.ZoneOffset

enum class ConfiguratorAnalyticsTimePreset {
    LAST_24_HOURS,
    LAST_7_DAYS,
    LAST_30_DAYS,
    LAST_365_DAYS,
    ALL_TIME,
    ;

    fun resolveBounds(now: OffsetDateTime = OffsetDateTime.now(ZoneOffset.UTC)): Pair<OffsetDateTime, OffsetDateTime> {
        val to = now
        val from =
            when (this) {
                LAST_24_HOURS -> now.minusHours(24)
                LAST_7_DAYS -> now.minusDays(7)
                LAST_30_DAYS -> now.minusDays(30)
                LAST_365_DAYS -> now.minusDays(365)
                ALL_TIME -> OffsetDateTime.of(1970, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC)
            }
        return from to to
    }

    companion object {
        fun fromParam(raw: String?): ConfiguratorAnalyticsTimePreset? {
            if (raw.isNullOrBlank()) return null
            return try {
                valueOf(raw.trim())
            } catch (_: IllegalArgumentException) {
                null
            }
        }
    }
}

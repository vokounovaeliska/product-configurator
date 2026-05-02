package cz.vokounova.configurator.analytics.application.exception

/**
 * Public analytics API refused the event batch (validation / policy).
 * A single, non-specific message is returned to clients.
 */
class ConfiguratorAnalyticsEventRejectedException private constructor() : IllegalArgumentException(MESSAGE) {
    companion object {
        private const val MESSAGE = "Analytics event rejected"

        fun reject(): Nothing = throw ConfiguratorAnalyticsEventRejectedException()
    }
}

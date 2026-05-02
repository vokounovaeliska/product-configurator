package cz.vokounova.configurator.analytics.domain

object ConfiguratorAnalyticsEventType {
    const val CONFIGURATOR_OPEN = "CONFIGURATOR_OPEN"
    const val CONFIGURATION_CHANGE = "CONFIGURATION_CHANGE"
    const val REQUEST_FORM_OPEN = "REQUEST_FORM_OPEN"
    const val REQUEST_SUBMITTED = "REQUEST_SUBMITTED"

    val CLIENT_ALLOWED: Set<String> =
        setOf(
            CONFIGURATOR_OPEN,
            CONFIGURATION_CHANGE,
            REQUEST_FORM_OPEN,
        )

    fun isClientAllowed(type: String): Boolean = type in CLIENT_ALLOWED
}

object ConfiguratorAnalyticsSurface {
    const val EMBED_IFRAME = "EMBED_IFRAME"
    const val PUBLIC_CONFIGURATOR_PAGE = "PUBLIC_CONFIGURATOR_PAGE"

    val ALL: Set<String> = setOf(EMBED_IFRAME, PUBLIC_CONFIGURATOR_PAGE)

    fun isValid(surface: String): Boolean = surface in ALL
}

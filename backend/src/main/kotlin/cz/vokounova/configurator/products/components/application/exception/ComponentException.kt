package cz.vokounova.configurator.products.components.application.exception

import cz.vokounova.configurator.shared.exceptions.ApplicationException

class ComponentException(
    code: ComponentErrorCode,
    message: String = code.message,
    cause: Throwable? = null,
) : ApplicationException(
        code = code.name,
        message = message,
        cause = cause,
    )

enum class ComponentErrorCode(
    val message: String,
) {
    CREATE_COMPONENT_FAILED("Create component failed"),
    UPDATE_COMPONENT_FAILED("Update component failed"),
}

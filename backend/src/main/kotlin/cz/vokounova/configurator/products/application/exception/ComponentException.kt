package cz.vokounova.configurator.products.application.exception

import cz.vokounova.configurator.shared.exceptions.ApplicationException

class ComponentException(
    errorCode: ComponentErrorCode,
    message: String? = null,
) : ApplicationException(errorCode.name, message)

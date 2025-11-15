package cz.vokounova.configurator.shared.exceptions

class CannotBeDeactivatedException(
    message: String,
) : ApplicationException(CommonErrorCode.RESOURCE_CANNOT_BE_DEACTIVATED.name, message)

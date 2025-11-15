package cz.vokounova.configurator.shared.exceptions

class CannotBeDeletedException(
    message: String,
) : ApplicationException(CommonErrorCode.RESOURCE_CANNOT_BE_DELETED.name, message)

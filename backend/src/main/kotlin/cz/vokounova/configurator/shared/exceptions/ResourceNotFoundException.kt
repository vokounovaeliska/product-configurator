package cz.vokounova.configurator.shared.exceptions

class ResourceNotFoundException(
    message: String,
) : ApplicationException(CommonErrorCode.RESOURCE_NOT_FOUND.name, message)

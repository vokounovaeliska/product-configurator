package cz.vokounova.configurator.shared.exceptions

class InvalidJsonPatchException(
    message: String,
) : ApplicationException(CommonErrorCode.VALIDATION_ERROR.name, message)

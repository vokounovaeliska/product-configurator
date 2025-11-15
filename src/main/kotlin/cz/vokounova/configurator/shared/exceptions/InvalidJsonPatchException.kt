package cz.vokounova.configurator.shared.exceptions

/**
 * Thrown when a JSON Patch payload cannot be applied to the target resource.
 */
class InvalidJsonPatchException(
    message: String,
) : ApplicationException(CommonErrorCode.VALIDATION_ERROR.name, message)

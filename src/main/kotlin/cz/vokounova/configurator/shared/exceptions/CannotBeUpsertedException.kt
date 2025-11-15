package cz.vokounova.configurator.shared.exceptions

class CannotBeUpsertedException(
    message: String,
) : ApplicationException(CommonErrorCode.RESOURCE_CANNOT_BE_UPSERTED.name, message)

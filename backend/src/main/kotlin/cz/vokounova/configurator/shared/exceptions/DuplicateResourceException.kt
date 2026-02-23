package cz.vokounova.configurator.shared.exceptions

open class DuplicateResourceException(
    message: String = "A resource with the same key already exists.",
) : ApplicationException(CommonErrorCode.DUPLICATE_OPTION_RULE.name, message)

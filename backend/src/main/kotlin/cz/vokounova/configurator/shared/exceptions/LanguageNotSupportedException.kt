package cz.vokounova.configurator.shared.exceptions

class LanguageNotSupportedException(
    message: String,
) : ApplicationException(CommonErrorCode.UNSUPPORTED_LANGUAGE_ERROR.name, message)

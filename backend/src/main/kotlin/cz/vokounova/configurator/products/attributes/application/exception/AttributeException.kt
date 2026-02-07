package cz.vokounova.configurator.products.attributes.application.exception

import cz.vokounova.configurator.shared.exceptions.ApplicationException

class AttributeException(
    code: AttributeErrorCode,
    message: String = code.message,
    cause: Throwable? = null,
) : ApplicationException(
        code = code.name,
        message = message,
        cause = cause,
    )

enum class AttributeErrorCode(
    val message: String,
) {
    CREATE_ATTRIBUTE_FAILED("Create attribute failed"),
    UPDATE_ATTRIBUTE_FAILED("Update attribute failed"),
    CREATE_ATTRIBUTE_OPTION_FAILED("Create attribute option failed"),
    UPDATE_ATTRIBUTE_OPTION_FAILED("Update attribute option failed"),
    INVALID_ATTRIBUTE_TYPE_CONFIGURATION("Invalid attribute type configuration"),
    ENUM_ATTRIBUTE_REQUIRES_OPTIONS("ENUM attribute requires at least one option"),
    INTEGER_RANGE_INVALID("Integer min value must be less than or equal to max value"),
    DECIMAL_RANGE_INVALID("Decimal min value must be less than or equal to max value"),
}

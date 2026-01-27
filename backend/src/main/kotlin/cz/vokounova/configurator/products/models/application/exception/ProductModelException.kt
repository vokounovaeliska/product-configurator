package cz.vokounova.configurator.products.models.application.exception

import cz.vokounova.configurator.shared.exceptions.ApplicationException

class ProductModelException(
    code: ProductModelErrorCode,
    message: String = code.message,
    cause: Throwable? = null,
) : ApplicationException(
        code = code.name,
        message = message,
        cause = cause,
    )

enum class ProductModelErrorCode(
    val message: String,
) {
    CREATE_PRODUCT_MODEL_FAILED("Create product model failed"),
    UPDATE_PRODUCT_MODEL_FAILED("Update product model failed"),
}

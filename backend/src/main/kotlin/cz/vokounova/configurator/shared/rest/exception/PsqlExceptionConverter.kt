package cz.vokounova.configurator.shared.rest.exception

import cz.vokounova.configurator.shared.rest.response.ValidationError
import cz.vokounova.configurator.shared.utils.snakeToCamelCase
import org.postgresql.util.PSQLException
import org.postgresql.util.PSQLState
import org.springframework.stereotype.Component

@Component
object PsqlExceptionConverter {
    fun toValidationError(e: PSQLException): ValidationError {
        val serverErrorMessage = e.serverErrorMessage

        var field: String? = null
        var message: String? = null

        when (e.sqlState) {
            PSQLState.FOREIGN_KEY_VIOLATION.state -> {
                message = "Associated record does not exist"
                field =
                    serverErrorMessage
                        ?.constraint
                        ?.substringAfter("${serverErrorMessage.table}_")
                        ?.substringBefore("_fk")
                        ?.snakeToCamelCase()
            }

            PSQLState.UNIQUE_VIOLATION.state -> {
                message = "Field value is already taken"
                field =
                    serverErrorMessage
                        ?.constraint
                        ?.substringAfter("${serverErrorMessage.table}_")
                        ?.substringBefore("_uk")
                        ?.snakeToCamelCase()
            }

            PSQLState.NOT_NULL_VIOLATION.state -> {
                message = "Field cannot be null"
                field =
                    "${serverErrorMessage?.table ?: "[table]"}.${serverErrorMessage?.column ?: "[column]"}"
            }

            else -> {
                message = "Validation error: ${e.message}"
                field = "${serverErrorMessage?.table ?: "[table]"}.${serverErrorMessage?.column ?: "[column]"}"
            }
        }

        return ValidationError(
            field = field,
            message = message,
        )
    }
}

package cz.vokounova.configurator.shared.rest.exception

import com.fasterxml.jackson.databind.JsonMappingException
import cz.vokounova.configurator.shared.rest.response.ValidationError

object JsonExceptionConverter {
    fun toValidationError(ex: JsonMappingException): List<ValidationError> =
        mutableListOf<ValidationError>().apply {
            ex.path.forEach {
                if (!it.fieldName.isNullOrBlank()) {
                    val validationMsg =
                        messageToError(
                            message = ex.message ?: "",
                            fieldName = it.fieldName,
                        )

                    add(
                        ValidationError(
                            field = it.fieldName,
                            message = validationMsg,
                        ),
                    )
                }
            }
        }

    private fun messageToError(
        message: String,
        fieldName: String,
    ): String =
        when {
            message.contains(
                "failed for JSON property $fieldName due to missing (therefore NULL)",
            ) -> "Cannot be null"

            message.contains("Cannot coerce empty String") -> "Cannot be empty"
            message.contains("Cannot deserialize value of type") -> "Provided value is invalid"
            else -> "Provided value is invalid"
        }
}

package cz.vokounova.configurator.unit.users

import cz.vokounova.configurator.shared.rest.jsonpatch.JsonPatchOperation
import cz.vokounova.configurator.shared.validations.BaseValidationCode
import cz.vokounova.configurator.users.domain.UserJsonPatchParams
import cz.vokounova.configurator.users.domain.UserJsonPatchParamsPath
import cz.vokounova.configurator.users.infrastructure.rest.validation.UserJsonPatchParamsValidator
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class UserJsonPatchParamsValidatorTest {
    private val validator = UserJsonPatchParamsValidator()

    @Test
    fun `Return error if first name is null`() {
        val patch =
            UserJsonPatchParams(
                path = UserJsonPatchParamsPath.FIRST_NAME,
                value = null,
                op = JsonPatchOperation.REPLACE,
            )

        val errors = validator.validate(patch)

        assertEquals(1, errors.size)

        val error = errors[0]

        assertEquals(BaseValidationCode.FIELD_IS_NULL.name, error.code)
    }

    @Test
    fun `Return error if first name is empty`() {
        val patch =
            UserJsonPatchParams(
                path = UserJsonPatchParamsPath.FIRST_NAME,
                value = " ",
                op = JsonPatchOperation.REPLACE,
            )

        val errors = validator.validate(patch)

        assertEquals(1, errors.size)

        val error = errors[0]

        assertEquals(BaseValidationCode.FIELD_IS_EMPTY.name, error.code)
    }

    @Test
    fun `Return error if surname is null`() {
        val patch =
            UserJsonPatchParams(
                path = UserJsonPatchParamsPath.SURNAME,
                value = null,
                op = JsonPatchOperation.REPLACE,
            )

        val errors = validator.validate(patch)

        assertEquals(1, errors.size)

        val error = errors[0]

        assertEquals(BaseValidationCode.FIELD_IS_NULL.name, error.code)
    }

    @Test
    fun `Return error if surname is empty`() {
        val patch =
            UserJsonPatchParams(
                path = UserJsonPatchParamsPath.SURNAME,
                value = " ",
                op = JsonPatchOperation.REPLACE,
            )

        val errors = validator.validate(patch)

        assertEquals(1, errors.size)

        val error = errors[0]

        assertEquals(BaseValidationCode.FIELD_IS_EMPTY.name, error.code)
    }

    @Test
    fun `Return error if email is null`() {
        val patch =
            UserJsonPatchParams(
                path = UserJsonPatchParamsPath.EMAIL,
                value = null,
                op = JsonPatchOperation.REPLACE,
            )

        val errors = validator.validate(patch)

        assertEquals(1, errors.size)

        val error = errors[0]

        assertEquals(BaseValidationCode.FIELD_IS_NULL.name, error.code)
    }

    @Test
    fun `Return error if email is empty`() {
        val patch =
            UserJsonPatchParams(
                path = UserJsonPatchParamsPath.EMAIL,
                value = " ",
                op = JsonPatchOperation.REPLACE,
            )

        val errors = validator.validate(patch)

        assertEquals(1, errors.size)

        val error = errors[0]

        assertEquals(BaseValidationCode.FIELD_IS_EMPTY.name, error.code)
    }
}

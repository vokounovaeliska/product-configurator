package cz.vokounova.configurator.unit.users

import cz.vokounova.configurator.shared.validations.BaseValidationCode
import cz.vokounova.configurator.users.infrastructure.rest.request.UserListQueryParams
import cz.vokounova.configurator.users.infrastructure.rest.validation.UserListQueryParamsValidator
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import java.util.*

class UserListQueryParamsValidatorTest {
    private val validator = UserListQueryParamsValidator()

    private val params =
        UserListQueryParams(
            orderBy = listOf(),
            limit = 3,
            ids = listOf(UUID.randomUUID()),
        )

    private val invalid = "invalid"

    @Test
    fun `Validates orderBy - invalid value`() {
        val invalid = params.copy(orderBy = listOf(invalid))
        val errors = validator.validate(invalid)

        assertEquals(1, errors.size)

        val error = errors[0]

        assertEquals(BaseValidationCode.VALUE_BAD_FORMAT.name, error.code)
    }

    @Test
    fun `Validates limit - invalid value`() {
        val invalid = params.copy(limit = 0)
        val errors = validator.validate(invalid)

        assertEquals(1, errors.size)

        val error = errors[0]

        assertEquals(BaseValidationCode.VALUE_TOO_SMALL.name, error.code)
    }
}

package cz.vokounova.configurator.unit.users

import cz.vokounova.configurator.shared.validations.BaseValidationCode
import cz.vokounova.configurator.users.application.exception.UserValidationCode
import cz.vokounova.configurator.users.domain.UserCreateParams
import cz.vokounova.configurator.users.infrastructure.rest.validation.UserCreateParamsValidator
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class UserCreateParamsValidatorTest {
    private val validator = UserCreateParamsValidator()

    private val params =
        UserCreateParams(
            firstName = "John",
            surname = "Doe",
            email = "Doe@email.com",
            password = "Password123",
            confirmPassword = "Password123",
        )

    @Test
    fun `Validates password and confirm password min length`() {
        val invalidParams = params.copy(password = "Short1")
        val errors = validator.validate(invalidParams)

        assertEquals(2, errors.size)
        assertTrue(errors.any { it.code == BaseValidationCode.VALUE_TOO_SMALL.name })
    }

    @Test
    fun `Validates password max length`() {
        val invalidParams = params.copy(password = "LongPassword123${"x".repeat(50)}")
        val errors = validator.validate(invalidParams)

        assertEquals(2, errors.size)
        assertTrue(errors.any { it.code == BaseValidationCode.VALUE_TOO_LARGE.name })
    }

    @Test
    fun `Validates password pattern`() {
        val invalidParams = params.copy(password = "goodLengthPassword")
        val errors = validator.validate(invalidParams)

        assertEquals(2, errors.size)
        assertEquals(BaseValidationCode.DOES_NOT_MATCH_PATTERN.name, errors.first().code)
    }

    @Test
    fun `Validates confirm password min length`() {
        val invalidParams = params.copy(confirmPassword = "Short1")
        val errors = validator.validate(invalidParams)

        assertEquals(2, errors.size)
        assertTrue(errors.any { it.code == BaseValidationCode.VALUE_TOO_SMALL.name })
    }

    @Test
    fun `Validates confirm password max length`() {
        val invalidParams = params.copy(confirmPassword = "LongPassword123${"x".repeat(50)}")
        val errors = validator.validate(invalidParams)

        assertEquals(2, errors.size)
        assertTrue(errors.any { it.code == BaseValidationCode.VALUE_TOO_LARGE.name })
    }

    @Test
    fun `Validates confirm password pattern`() {
        val invalidParams = params.copy(confirmPassword = "goodLengthPassword")
        val errors = validator.validate(invalidParams)

        assertEquals(2, errors.size)
        assertTrue(errors.any { it.code == UserValidationCode.PASSWORDS_NOT_MATCH.name })
    }

    @Test
    fun `Validates password and confirm password match`() {
        val invalidParams = params.copy(password = "Password123", confirmPassword = "DifferentPassword456")
        val errors = validator.validate(invalidParams)

        assertEquals(1, errors.size)
        assertEquals(UserValidationCode.PASSWORDS_NOT_MATCH.name, errors.first().code)
    }

    @Test
    fun `Validates empty surname`() {
        val invalidParams = params.copy(surname = "")
        val errors = validator.validate(invalidParams)

        assertEquals(1, errors.size)
        assertEquals(BaseValidationCode.FIELD_IS_EMPTY.name, errors.first().code)
    }

    @Test
    fun `Validates empty surname with spaces`() {
        val invalidParams = params.copy(surname = "     ")
        val errors = validator.validate(invalidParams)

        assertEquals(1, errors.size)
        assertEquals(BaseValidationCode.FIELD_IS_EMPTY.name, errors.first().code)
    }

    @Test
    fun `Validates empty first name`() {
        val invalidParams = params.copy(firstName = "")
        val errors = validator.validate(invalidParams)

        assertEquals(1, errors.size)
        assertEquals(BaseValidationCode.FIELD_IS_EMPTY.name, errors.first().code)
    }

    @Test
    fun `Validates empty first name with spaces`() {
        val invalidParams = params.copy(firstName = "     ")
        val errors = validator.validate(invalidParams)

        assertEquals(1, errors.size)
        assertEquals(BaseValidationCode.FIELD_IS_EMPTY.name, errors.first().code)
    }

    @Test
    fun `Validates empty email `() {
        val invalidParams = params.copy(email = "")
        val errors = validator.validate(invalidParams)

        assertEquals(1, errors.size)
        assertEquals(BaseValidationCode.FIELD_IS_EMPTY.name, errors.first().code)
    }

    @Test
    fun `Validates empty email with spaces`() {
        val invalidParams = params.copy(email = "     ")
        val errors = validator.validate(invalidParams)

        assertEquals(1, errors.size)
        assertEquals(BaseValidationCode.FIELD_IS_EMPTY.name, errors.first().code)
    }
}

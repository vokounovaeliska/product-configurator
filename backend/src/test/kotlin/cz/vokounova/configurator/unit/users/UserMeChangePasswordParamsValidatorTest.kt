package cz.vokounova.configurator.unit.users

import cz.vokounova.configurator.shared.validations.BaseValidationCode
import cz.vokounova.configurator.users.application.configuration.UserPasswordEncoder
import cz.vokounova.configurator.users.application.exception.UserValidationCode
import cz.vokounova.configurator.users.domain.UserMeChangePasswordParams
import cz.vokounova.configurator.users.infrastructure.rest.validation.UserMeChangePasswordParamsValidator
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class UserMeChangePasswordParamsValidatorTest {
    private val encoder = UserPasswordEncoder(4)
    private val validator = UserMeChangePasswordParamsValidator(encoder)

    private val params =
        UserMeChangePasswordParams(
            newPassword = "Password123",
            confirmNewPassword = "Password123",
            oldPassword = "OldPassword123",
            encodedOldPassword = encoder.encode("OldPassword123"),
        )

    @Test
    fun `Validates password and confirm password min length`() {
        val invalidParams = params.copy(newPassword = "Short1")
        val errors = validator.validate(invalidParams)

        assertEquals(2, errors.size)
        assertTrue(errors.any { it.code == BaseValidationCode.VALUE_TOO_SMALL.name })
    }

    @Test
    fun `Validates password max length`() {
        val invalidParams = params.copy(newPassword = "LongPassword123${"x".repeat(50)}")
        val errors = validator.validate(invalidParams)

        assertEquals(2, errors.size)
        assertTrue(errors.any { it.code == BaseValidationCode.VALUE_TOO_LARGE.name })
    }

    @Test
    fun `Validates password pattern`() {
        val invalidParams = params.copy(newPassword = "goodLengthPassword")
        val errors = validator.validate(invalidParams)

        assertEquals(2, errors.size)
        assertEquals(BaseValidationCode.DOES_NOT_MATCH_PATTERN.name, errors.first().code)
    }

    @Test
    fun `Validates confirm password min length`() {
        val invalidParams = params.copy(confirmNewPassword = "Short1")
        val errors = validator.validate(invalidParams)

        assertEquals(2, errors.size)
        assertTrue(errors.any { it.code == BaseValidationCode.VALUE_TOO_SMALL.name })
    }

    @Test
    fun `Validates confirm password max length`() {
        val invalidParams = params.copy(confirmNewPassword = "LongPassword123${"x".repeat(50)}")
        val errors = validator.validate(invalidParams)

        assertEquals(2, errors.size)
        assertTrue(errors.any { it.code == BaseValidationCode.VALUE_TOO_LARGE.name })
    }

    @Test
    fun `Validates confirm password pattern`() {
        val invalidParams = params.copy(confirmNewPassword = "goodLengthPassword")
        val errors = validator.validate(invalidParams)

        assertEquals(2, errors.size)
        assertTrue(errors.any { it.code == BaseValidationCode.DOES_NOT_MATCH_PATTERN.name })
    }

    @Test
    fun `Validates password and confirm password match`() {
        val invalidParams = params.copy(newPassword = "Password123", confirmNewPassword = "DifferentPassword456")
        val errors = validator.validate(invalidParams)

        assertEquals(1, errors.size)
        assertEquals(UserValidationCode.PASSWORDS_NOT_MATCH.name, errors.first().code)
    }

    @Test
    fun `Validates old password and encoded old password match`() {
        val invalidParams =
            params.copy(
                oldPassword = "Password123",
                encodedOldPassword = encoder.encode("DifferentPassword456"),
            )
        val errors = validator.validate(invalidParams)

        assertEquals(1, errors.size)
        assertEquals(UserValidationCode.PASSWORD_IS_INVALID.name, errors.first().code)
    }
}

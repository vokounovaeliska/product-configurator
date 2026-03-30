package cz.vokounova.configurator.unit.users

import cz.vokounova.configurator.mocks.UserMocks
import cz.vokounova.configurator.shared.rest.jsonpatch.JsonPatchOperation
import cz.vokounova.configurator.shared.validations.BaseValidationCode
import cz.vokounova.configurator.users.application.validation.UserEmailValidator
import cz.vokounova.configurator.users.application.validation.UserEmailValidatorParams
import cz.vokounova.configurator.users.domain.User
import cz.vokounova.configurator.users.domain.UserCreateParams
import cz.vokounova.configurator.users.domain.UserJsonPatchParams
import cz.vokounova.configurator.users.domain.UserJsonPatchParamsPath
import cz.vokounova.configurator.users.ports.outbound.UserRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.kotlin.whenever

class UserEmailValidatorTest {
    private val userRepository: UserRepository = mock()
    private val userEmailValidator = UserEmailValidator(userRepository)

    @Test
    fun `validateCreate - should pass when name is unique`() {
        val params =
            UserCreateParams(
                email = "johndoe@email.com",
                surname = "Name",
                firstName = "Name",
                password = "Password",
                confirmPassword = "Password",
            )

        whenever(userRepository.existsForEmail("doe@email.com")).thenReturn(false)

        val result = userEmailValidator.validate(UserEmailValidatorParams(createParams = params))
        assertEquals(0, result.size)
    }

    @Test
    fun `validateCreate - should return error when email already exists`() {
        val params =
            UserCreateParams(
                email = "johndoe@email.com",
                surname = "Name",
                firstName = "Name",
                password = "Password",
                confirmPassword = "Password",
            )

        whenever(userRepository.existsForEmail("johndoe@email.com")).thenReturn(true)

        val result = userEmailValidator.validate(UserEmailValidatorParams(createParams = params))

        assertEquals(1, result.size)
        assertEquals(BaseValidationCode.IS_NOT_UNIQUE.name, result.first().code)
        assertEquals("email", result.first().field)
    }

    @Test
    fun `validateUpdate - should pass when email is not being updated`() {
        val existingUser = createMockUser()
        val jsonPatchParams =
            listOf(
                UserJsonPatchParams(
                    path = UserJsonPatchParamsPath.SURNAME,
                    value = "Surname",
                    op = JsonPatchOperation.REPLACE,
                ),
            )

        val result = userEmailValidator.validate(UserEmailValidatorParams(createParams = null, jsonPatchParams, existingUser))
        assertEquals(0, result.size)
    }

    @Test
    fun `validateUpdate - should pass when email is updated to unique email`() {
        val existingUser = createMockUser()
        val jsonPatchParams =
            listOf(
                UserJsonPatchParams(
                    path = UserJsonPatchParamsPath.EMAIL,
                    value = "uniqueemail@email.com",
                    op = JsonPatchOperation.REPLACE,
                ),
            )

        whenever(userRepository.existsForEmail("uniqueemail@email.com")).thenReturn(false)

        val result = userEmailValidator.validate(UserEmailValidatorParams(createParams = null, jsonPatchParams, existingUser))
        assertEquals(0, result.size)
    }

    @Test
    fun `validateUpdate - should return error when name is updated to existing name`() {
        val existingUser = createMockUser()
        val jsonPatchParams =
            listOf(
                UserJsonPatchParams(
                    path = UserJsonPatchParamsPath.EMAIL,
                    value = "email@email.com",
                    op = JsonPatchOperation.REPLACE,
                ),
            )

        whenever(userRepository.existsForEmail("email@email.com", existingUser.id)).thenReturn(true)

        val result = userEmailValidator.validate(UserEmailValidatorParams(createParams = null, jsonPatchParams, existingUser))

        assertEquals(1, result.size)
        assertEquals(BaseValidationCode.IS_NOT_UNIQUE.name, result.first().code)
        assertEquals("email", result.first().field)
    }

    @Test
    fun `validateUpdate - should pass when name is updated to same name`() {
        val existingUser = createMockUser()
        val jsonPatchParams =
            listOf(
                UserJsonPatchParams(
                    path = UserJsonPatchParamsPath.EMAIL,
                    value = "original@email.com", // Same name
                    op = JsonPatchOperation.REPLACE,
                ),
            )

        val result = userEmailValidator.validate(UserEmailValidatorParams(createParams = null, jsonPatchParams, existingUser))
        assertEquals(0, result.size)
    }

    private fun createMockUser(): User =
        UserMocks.getUser(
            email = "original@email.com",
        )
}

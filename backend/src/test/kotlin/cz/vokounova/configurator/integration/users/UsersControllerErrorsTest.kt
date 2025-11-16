package cz.vokounova.configurator.integration.users

import com.fasterxml.jackson.core.type.TypeReference
import cz.vokounova.configurator.configuration.BaseIntegrationTest
import cz.vokounova.configurator.generated.jooq.tables.references.USER
import cz.vokounova.configurator.mocks.AuthMocks
import cz.vokounova.configurator.mocks.UserMocks
import cz.vokounova.configurator.shared.exceptions.CommonErrorCode
import cz.vokounova.configurator.shared.rest.response.ValidationErrorResponse
import cz.vokounova.configurator.shared.validations.BaseValidationCode
import cz.vokounova.configurator.users.domain.UserChangePasswordParams
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.infrastructure.rest.mapper.request.UserCreateRequestDto
import cz.vokounova.configurator.users.infrastructure.rest.mapper.request.UserPatchRequestDto
import cz.vokounova.configurator.users.ports.outboud.UserRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.Base64
import java.util.UUID

class UsersControllerErrorsTest : BaseIntegrationTest() {
    companion object {
        private const val USERS_URL = "/users/api/v1/users"
    }

    @Autowired
    protected lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var userRepository: UserRepository

    @BeforeEach
    override fun cleanUp() {
        dslContext.truncate(USER).cascade().execute()
    }

    val uuid = "aefab56d-2c61-4a5d-a8fa-f3790ec8c8c3"

    @Test
    fun `List - Unauthorized - when authentication is missing`() {
        mockMvc
            .perform(
                get(USERS_URL)
                    .contentType(MediaType.APPLICATION_JSON),
            ).andExpect(status().isUnauthorized)
    }

    @Test
    fun `List - BadRequest - when less fields in after cursor than in order by`() {
        val cursor =
            "{" +
                "  \"firstName\": \"john\",\n" +
                "  \"surname\": \"doe\",\n" +
                "  \"id\": \"$uuid\"" +
                "}"
        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray())

        mockMvc
            .perform(
                get(USERS_URL)
                    .param("orderBy", "firstName,surname,email")
                    .param("after", encodedCursor)
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isBadRequest)
    }

    @Test
    fun `List - BadRequest - when more fields in after cursor than in order by`() {
        val cursor =
            "{" +
                "  \"firstName\": \"john\",\n" +
                "  \"surname\": \"doe\",\n" +
                "  \"id\": \"$uuid\"" +
                "}"
        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray())

        mockMvc
            .perform(
                get(USERS_URL)
                    .param("orderBy", "surname")
                    .param("after", encodedCursor)
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isBadRequest)
    }

    @Test
    fun `List - BadRequest - when different fields in after cursor than in order by`() {
        val cursor =
            "{" +
                "  \"firstName\": \"john\",\n" +
                "  \"surname\": \"doe\",\n" +
                "  \"id\": \"$uuid\"" +
                "}"
        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray())

        mockMvc
            .perform(
                get(USERS_URL)
                    .param("orderBy", "surname,email")
                    .param("after", encodedCursor)
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isBadRequest)
    }

    @Test
    fun `List - BadRequest - when less fields in before cursor than in order by`() {
        val cursor =
            "{" +
                "  \"firstName\": \"john\",\n" +
                "  \"surname\": \"doe\",\n" +
                "  \"id\": \"$uuid\"" +
                "}"
        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray())

        mockMvc
            .perform(
                get(USERS_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .param("orderBy", "firstName,surname,email")
                    .param("before", encodedCursor)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isBadRequest)
    }

    @Test
    fun `List - BadRequest - when more fields in before cursor than in order by`() {
        val cursor =
            "{" +
                "  \"firstName\": \"john\",\n" +
                "  \"surname\": \"doe\",\n" +
                "  \"id\": \"$uuid\"" +
                "}"
        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray())

        mockMvc
            .perform(
                get(USERS_URL)
                    .param("orderBy", "surname")
                    .param("before", encodedCursor)
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isBadRequest)
    }

    @Test
    fun `List - BadRequest - when different fields in before cursor than in order by`() {
        val cursor =
            "{" +
                "  \"firstName\": \"john\",\n" +
                "  \"surname\": \"doe\",\n" +
                "  \"id\": \"$uuid\"" +
                "}"
        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray())

        mockMvc
            .perform(
                get(USERS_URL)
                    .param("orderBy", "surname,email")
                    .param("before", encodedCursor)
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isBadRequest)
    }

    @Test
    fun `List - BadRequest - when search is too short`() {
        mockMvc
            .perform(
                get(USERS_URL)
                    .param("search", "a")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isBadRequest)
    }

    @Test
    fun `List - BadRequest - when after cursor invalid value added characters`() {
        val cursor =
            "{" +
                "  \"firstName\": \"john\",\n" +
                "  \"surname\": \"doe\",\n" +
                "  \"id\": \"$uuid\"" +
                "}"

        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray()) + "invalid"

        mockMvc
            .perform(
                get(USERS_URL)
                    .param("orderBy", "surname,firstName")
                    .param("after", encodedCursor)
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isBadRequest)
    }

    @Test
    fun `List - BadRequest - when after cursor invalid value deleted characters at end`() {
        val cursor =
            "{" +
                "  \"firstName\": \"john\",\n" +
                "  \"surname\": \"doe\",\n" +
                "  \"id\": \"$uuid\"" +
                "}"

        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray()).dropLast(4)

        mockMvc
            .perform(
                get(USERS_URL)
                    .param("orderBy", "surname,firstName")
                    .param("after", encodedCursor)
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isBadRequest)
    }

    @Test
    fun `List - BadRequest - when after cursor invalid value deleted characters at beginning`() {
        val cursor =
            "{" +
                "  \"firstName\": \"john\",\n" +
                "  \"surname\": \"doe\",\n" +
                "  \"id\": \"$uuid\"" +
                "}"

        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray()).drop(4)

        mockMvc
            .perform(
                get(USERS_URL)
                    .param("orderBy", "surname,firstName")
                    .param("after", encodedCursor)
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isBadRequest)
    }

    @Test
    fun `List - BadRequest - when after cursor invalid value replaced characters`() {
        val cursor =
            "{" +
                "  \"firstName\": \"john\",\n" +
                "  \"surname\": \"doe\",\n" +
                "  \"id\": \"$uuid\"" +
                "}"

        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray()).replaceFirst("6", "7")

        mockMvc
            .perform(
                get(USERS_URL)
                    .param("orderBy", "surname,firstName")
                    .param("after", encodedCursor)
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isBadRequest)
    }

    @Test
    fun `List - BadRequest - when after cursor invalid json`() {
        val invalidCursor =
            "{" +
                "  \"firstName\": \"john\",\n" +
                "  \"name\": \"do"

        val encodedCursor = Base64.getEncoder().encodeToString(invalidCursor.toByteArray()).dropLast(4)

        mockMvc
            .perform(
                get(USERS_URL)
                    .param("orderBy", "surname,firstName")
                    .param("after", encodedCursor)
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isBadRequest)
    }

    @Test
    fun `List - BadRequest - when before cursor invalid value added characters`() {
        val cursor =
            "{" +
                "  \"firstName\": \"john\",\n" +
                "  \"surname\": \"doe\",\n" +
                "  \"id\": \"$uuid\"" +
                "}"

        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray()) + "invalid"

        mockMvc
            .perform(
                get(USERS_URL)
                    .param("orderBy", "surname,firstName")
                    .param("before", encodedCursor)
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isBadRequest)
    }

    @Test
    fun `List - BadRequest - when before cursor invalid value deleted characters at end`() {
        val cursor =
            "{" +
                "  \"firstName\": \"john\",\n" +
                "  \"surname\": \"doe\",\n" +
                "  \"id\": \"$uuid\"" +
                "}"

        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray()).dropLast(4)

        mockMvc
            .perform(
                get(USERS_URL)
                    .param("orderBy", "surname,firstName")
                    .param("before", encodedCursor)
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isBadRequest)
    }

    @Test
    fun `List - BadRequest - when before cursor invalid value deleted characters at beginning`() {
        val cursor =
            "{" +
                "  \"firstName\": \"john\",\n" +
                "  \"surname\": \"doe\",\n" +
                "  \"id\": \"$uuid\"" +
                "}"

        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray()).drop(4)

        mockMvc
            .perform(
                get(USERS_URL)
                    .param("orderBy", "surname,firstName")
                    .param("before", encodedCursor)
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isBadRequest)
    }

    @Test
    fun `List - BadRequest - when before cursor invalid value replaced characters`() {
        val cursor =
            "{" +
                "  \"firstName\": \"john\",\n" +
                "  \"surname\": \"doe\",\n" +
                "  \"id\": \"$uuid\"" +
                "}"

        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray()).replaceFirst("6", "7")

        mockMvc
            .perform(
                get(USERS_URL)
                    .param("orderBy", "surname,firstName")
                    .param("before", encodedCursor)
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isBadRequest)
    }

    @Test
    fun `List - BadRequest - when before cursor invalid json`() {
        val invalidCursor =
            "{" +
                "  \"firstName\": \"john\",\n" +
                "  \"name\": \"do"

        val encodedCursor = Base64.getEncoder().encodeToString(invalidCursor.toByteArray()).dropLast(4)

        mockMvc
            .perform(
                get(USERS_URL)
                    .param("orderBy", "surname,firstName")
                    .param("before", encodedCursor)
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isBadRequest)
    }

    @Test
    fun `Get - BadRequest - when id in path is invalid`() {
        mockMvc
            .perform(
                get("$USERS_URL/1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().is4xxClientError)
    }

    @Test
    fun `Get - NotFound - when user for id does not exist`() {
        mockMvc
            .perform(
                get("$USERS_URL/$uuid")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isNotFound)
    }

    @Test
    fun `Post - BadRequest - when payload is invalid`() {
        val payload = "{\"whatever\"}"
        mockMvc
            .perform(
                post(USERS_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin())
                    .content(payload),
            ).andExpect(status().is4xxClientError)
    }

    @Test
    fun `Post - BadRequest - when email, surname and first name are empty`() {
        val password = "SecurePassword123"

        val params =
            UserCreateRequestDto(
                firstName = "",
                surname = "",
                email = "",
                password = password,
                confirmPassword = password,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post(USERS_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin())
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val parsedResult =
            objectMapper.readValue(
                result.response.contentAsString,
                object : TypeReference<ValidationErrorResponse>() {},
            )

        assertEquals(3, parsedResult.errors.size)
        assertTrue(parsedResult.errors.any { it.field == "surname" })
        assertTrue(parsedResult.errors.any { it.field == "firstName" })
        assertTrue(parsedResult.errors.any { it.field == "email" })
    }

    @Test
    fun `Post - BadRequest - when password is too short`() {
        val incorrectPassword = "short"

        val params =
            UserCreateRequestDto(
                firstName = "John",
                surname = "Test",
                email = "john-test@example.com",
                password = incorrectPassword,
                confirmPassword = incorrectPassword,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post(USERS_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin())
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val parsedResult =
            objectMapper.readValue(
                result.response.contentAsString,
                object : TypeReference<ValidationErrorResponse>() {},
            )

        assertEquals(4, parsedResult.errors.size)
        assertTrue(parsedResult.errors.any { it.field == "password" })
        assertTrue(parsedResult.errors.any { it.field == "confirmPassword" })
        assertTrue(parsedResult.errors.any { it.message?.contains("match") == true })
        assertTrue(parsedResult.errors.any { it.message?.contains("short") == true })
    }

    @Test
    fun `Post - BadRequest - when password has no uppercase nor number`() {
        val incorrectPassword = "verylongpassword"

        val params =
            UserCreateRequestDto(
                firstName = "John",
                surname = "Test",
                email = "john-test@example.com",
                password = incorrectPassword,
                confirmPassword = incorrectPassword,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post(USERS_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin())
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val parsedResult =
            objectMapper.readValue(
                result.response.contentAsString,
                object : TypeReference<ValidationErrorResponse>() {},
            )

        assertEquals(2, parsedResult.errors.size)
        assertTrue(parsedResult.errors.any { it.field == "password" })
        assertTrue(parsedResult.errors.any { it.field == "confirmPassword" })
        assertTrue(parsedResult.errors.all { it.message?.contains("match") == true })
    }

    @Test
    fun `Post - BadRequest - when password has no lowercase nor number`() {
        val incorrectPassword = "VERYLONGPASSWORD"

        val params =
            UserCreateRequestDto(
                firstName = "John",
                surname = "Test",
                email = "john-test@example.com",
                password = incorrectPassword,
                confirmPassword = incorrectPassword,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post(USERS_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin())
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val parsedResult =
            objectMapper.readValue(
                result.response.contentAsString,
                object : TypeReference<ValidationErrorResponse>() {},
            )

        assertEquals(2, parsedResult.errors.size)
        assertTrue(parsedResult.errors.any { it.field == "password" })
        assertTrue(parsedResult.errors.any { it.field == "confirmPassword" })
        assertTrue(parsedResult.errors.all { it.message?.contains("match") == true })
    }

    @Test
    fun `Post - BadRequest - when password has no number`() {
        val incorrectPassword = "veryLongPassword"

        val params =
            UserCreateRequestDto(
                firstName = "John",
                surname = "Test",
                email = "john-test@example.com",
                password = incorrectPassword,
                confirmPassword = incorrectPassword,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post(USERS_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin())
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val parsedResult =
            objectMapper.readValue(
                result.response.contentAsString,
                object : TypeReference<ValidationErrorResponse>() {},
            )

        assertEquals(2, parsedResult.errors.size)
        assertTrue(parsedResult.errors.any { it.field == "password" })
        assertTrue(parsedResult.errors.any { it.field == "confirmPassword" })
        assertTrue(parsedResult.errors.all { it.message?.contains("match") == true })
    }

    @Test
    fun `Post - BadRequest - when password has no uppercase`() {
        val incorrectPassword = "password123"

        val params =
            UserCreateRequestDto(
                firstName = "John",
                surname = "Test",
                email = "john-test@example.com",
                password = incorrectPassword,
                confirmPassword = incorrectPassword,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post(USERS_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin())
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val parsedResult =
            objectMapper.readValue(
                result.response.contentAsString,
                object : TypeReference<ValidationErrorResponse>() {},
            )

        assertEquals(2, parsedResult.errors.size)
        assertTrue(parsedResult.errors.any { it.field == "password" })
        assertTrue(parsedResult.errors.any { it.field == "confirmPassword" })
        assertTrue(parsedResult.errors.all { it.message?.contains("match") == true })
    }

    @Test
    fun `Post - BadRequest - when password has no lowercase`() {
        val incorrectPassword = "PASSWORD123"

        val params =
            UserCreateRequestDto(
                firstName = "John",
                surname = "Test",
                email = "john-test@example.com",
                password = incorrectPassword,
                confirmPassword = incorrectPassword,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post(USERS_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin())
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val parsedResult =
            objectMapper.readValue(
                result.response.contentAsString,
                object : TypeReference<ValidationErrorResponse>() {},
            )

        assertEquals(2, parsedResult.errors.size)
        assertTrue(parsedResult.errors.any { it.field == "password" })
        assertTrue(parsedResult.errors.any { it.field == "confirmPassword" })
        assertTrue(parsedResult.errors.all { it.message?.contains("match") == true })
    }

    @Test
    fun `Post - BadRequest - when password and confirm password do not match`() {
        val password = "VerySecurePassword123"
        val incorrectConfirmPassword = password + "somethingDifferent"

        val params =
            UserCreateRequestDto(
                firstName = "John",
                surname = "Test",
                email = "john-test@example.com",
                password = password,
                confirmPassword = incorrectConfirmPassword,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post(USERS_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin())
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val parsedResult =
            objectMapper.readValue(
                result.response.contentAsString,
                object : TypeReference<ValidationErrorResponse>() {},
            )

        val error = parsedResult.errors[0]
        assertTrue(error.field == "password")
        assertTrue(error.message?.contains("do not match") == true)
    }

    @Test
    fun `Post - BadRequest - when email is taken`() {
        val user = UserMocks.getUser()

        userRepository.create(user)

        val u = UserMocks.getUser(email = "whatever")
        userRepository.create(u)

        val params =
            UserCreateRequestDto(
                firstName = "John",
                surname = "Test",
                email = user.email,
                password = "securePassword1",
                confirmPassword = "securePassword1",
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post(USERS_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = u.id, email = u.email))
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val parsedResult =
            objectMapper.readValue(
                result.response.contentAsString,
                object : TypeReference<ValidationErrorResponse>() {},
            )

        val error = parsedResult.errors[0]
        assertTrue(error.field == "email")
        assertEquals(BaseValidationCode.IS_NOT_UNIQUE.name, error.code)
        assertTrue(error.message?.contains("is not unique") == true)
    }

    @Test
    fun `Patch - NotFound - when user for id does not exist`() {
        val params =
            listOf(
                UserPatchRequestDto(
                    path = UserPatchRequestDto.Path.SlashFirstName,
                    value = "hi",
                    op = UserPatchRequestDto.Op.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        mockMvc
            .perform(
                patch("$USERS_URL/$uuid")
                    .contentType("application/json-patch+json")
                    .with(AuthMocks.mockAdmin())
                    .content(payload),
            ).andExpect(status().isNotFound)
    }

    @Test
    fun `Patch - BadRequest - when email is taken`() {
        val user1 = UserMocks.getUser()
        userRepository.create(user1)

        val user2 =
            user1.copy(
                id = UserId(UUID.fromString(uuid)),
                email = "john@example.com",
            )
        userRepository.create(user2)

        val u = UserMocks.getUser(email = "whatever@example.com")
        userRepository.create(u)

        val params =
            listOf(
                UserPatchRequestDto(
                    path = UserPatchRequestDto.Path.SlashEmail,
                    value = user1.email,
                    op = UserPatchRequestDto.Op.Replace,
                ),
                UserPatchRequestDto(
                    path = UserPatchRequestDto.Path.SlashSurname,
                    value = "some random new surname",
                    op = UserPatchRequestDto.Op.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    patch("${USERS_URL}/${user2.id.value}")
                        .contentType("application/json-patch+json")
                        .with(AuthMocks.mockUser(userId = u.id, email = u.email))
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val parsedResult =
            objectMapper.readValue(
                result.response.contentAsString,
                object : TypeReference<ValidationErrorResponse>() {},
            )

        val error = parsedResult.errors[0]

        assertTrue(error.field == "email")
        assertEquals(BaseValidationCode.IS_NOT_UNIQUE.name, error.code)
        assertTrue(error.message?.contains("is not unique") == true)
    }

    @Test
    fun `Patch - BadRequest - when email, surname or first name are empty`() {
        val user = UserMocks.getUser()
        userRepository.create(user)

        val params =
            listOf(
                UserPatchRequestDto(
                    path = UserPatchRequestDto.Path.SlashEmail,
                    value = "",
                    op = UserPatchRequestDto.Op.Replace,
                ),
                UserPatchRequestDto(
                    path = UserPatchRequestDto.Path.SlashSurname,
                    value = "",
                    op = UserPatchRequestDto.Op.Replace,
                ),
                UserPatchRequestDto(
                    path = UserPatchRequestDto.Path.SlashFirstName,
                    value = "",
                    op = UserPatchRequestDto.Op.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    patch("${USERS_URL}/${user.id.value}")
                        .contentType("application/json-patch+json")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val parsedResult =
            objectMapper.readValue(
                result.response.contentAsString,
                object : TypeReference<ValidationErrorResponse>() {},
            )

        assertEquals(3, parsedResult.errors.size)

        val errorEmail = parsedResult.errors.find { it.field == "/email" }
        val errorSurname = parsedResult.errors.find { it.field == "/surname" }
        val errorFirstName = parsedResult.errors.find { it.field == "/firstName" }

        assertEquals("FIELD_IS_EMPTY", errorEmail?.code)
        assertEquals("FIELD_IS_EMPTY", errorSurname?.code)
        assertEquals("FIELD_IS_EMPTY", errorFirstName?.code)
    }

    @Test
    fun `Patch - BadRequest - when content type is invalid`() {
        val params =
            listOf(
                UserPatchRequestDto(
                    path = UserPatchRequestDto.Path.SlashSurname,
                    value = null,
                    op = UserPatchRequestDto.Op.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    patch("$USERS_URL/$uuid")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin())
                        .content(payload),
                ).andExpect(status().is4xxClientError)
                .andReturn()

        val parsedResult =
            objectMapper.readValue(
                result.response.contentAsString,
                object : TypeReference<ValidationErrorResponse>() {},
            )

        val error = parsedResult.errors[0]

        assertEquals(CommonErrorCode.VALIDATION_ERROR.name, error.code)
        assertEquals("Content-Type 'application/json' is not supported", error.message)
    }

    @Test
    fun `Patch - BadRequest - non nullable fields`() {
        val user = UserMocks.getUser()

        userRepository.create(user)

        val params =
            listOf(
                UserPatchRequestDto(
                    path = UserPatchRequestDto.Path.SlashEmail,
                    value = null,
                    op = UserPatchRequestDto.Op.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    patch("$USERS_URL/${user.id.value}")
                        .contentType("application/json-patch+json")
                        .with(AuthMocks.mockAdmin())
                        .content(payload),
                ).andExpect(status().is4xxClientError)
                .andReturn()

        val parsedResult =
            objectMapper.readValue(
                result.response.contentAsString,
                object : TypeReference<ValidationErrorResponse>() {},
            )

        val error = parsedResult.errors[0]

        assertEquals(BaseValidationCode.FIELD_IS_NULL.name, error.code)
        assertNotNull(error.message)
        assertEquals("/email", error.field)
    }

    @Test
    fun `Patch - BadRequest - invalid payload`() {
        val str = "[{\"path\":90ec8c8c3\"}]"
        val payload = objectMapper.writeValueAsString(str)

        val result =
            mockMvc
                .perform(
                    patch("$USERS_URL/$uuid")
                        .contentType("application/json-patch+json")
                        .with(AuthMocks.mockAdmin())
                        .content(payload),
                ).andExpect(status().is4xxClientError)
                .andReturn()

        val parsedResult =
            objectMapper.readValue(
                result.response.contentAsString,
                object : TypeReference<ValidationErrorResponse>() {},
            )

        val error = parsedResult.errors[0]

        assertEquals(CommonErrorCode.VALIDATION_ERROR.name, error.code)
        assertTrue(error.message?.contains("Cannot deserialize value") ?: false)
        assertNull(error.field)
    }

    @Test
    fun `Patch - BadRequest - unsupported json patch operation`() {
        val str = "[{\"op\":\"remove\",\"path\":\"/whatever\"}]"
        val payload = objectMapper.writeValueAsString(str)

        val result =
            mockMvc
                .perform(
                    patch("$USERS_URL/$uuid")
                        .contentType("application/json-patch+json")
                        .with(AuthMocks.mockAdmin())
                        .content(payload),
                ).andExpect(status().is4xxClientError)
                .andReturn()

        val parsedResult =
            objectMapper.readValue(
                result.response.contentAsString,
                object : TypeReference<ValidationErrorResponse>() {},
            )

        val error = parsedResult.errors[0]

        assertEquals(CommonErrorCode.VALIDATION_ERROR.name, error.code)
        assertTrue(error.message?.contains("Cannot deserialize value") ?: false)
        assertNull(error.field)
    }

    @Test
    fun `Get - Unauthorized - when user is not logged in and tries to get his info`() {
        mockMvc
            .perform(
                get("${USERS_URL}/me")
                    .contentType(MediaType.APPLICATION_JSON),
            ).andExpect(status().isUnauthorized)
    }

    @Test
    fun `Post - BadRequest - when user tries to change password but password and confirm password do not match`() {
        val user = UserMocks.getUser()

        userRepository.create(user)

        val params =
            UserChangePasswordParams(
                newPassword = "SecurePassword123",
                confirmNewPassword = "DifferentPassword123",
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post("${USERS_URL}/${user.id.value}/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin())
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val parsedResult =
            objectMapper.readValue(
                result.response.contentAsString,
                object : TypeReference<ValidationErrorResponse>() {},
            )

        val error = parsedResult.errors[0]
        assertTrue(error.field == "newPassword")
        assertTrue(error.message?.contains("do not match") == true)
    }

    @Test
    fun `Post - NotFound - when changing a password of user who does not exist`() {
        val newPassword = "SecurePassword123"

        val params =
            UserChangePasswordParams(
                newPassword = newPassword,
                confirmNewPassword = newPassword,
            )

        val payload = objectMapper.writeValueAsString(params)

        mockMvc
            .perform(
                post("$USERS_URL/$uuid/change-password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin())
                    .content(payload),
            ).andExpect(status().isNotFound)
    }

    @Test
    fun `Post - BadRequest - when change password new password has no uppercase nor number`() {
        val incorrectPassword = "verylongpassword"

        val user = UserMocks.getUser()

        userRepository.create(user)

        val params =
            UserChangePasswordParams(
                newPassword = incorrectPassword,
                confirmNewPassword = incorrectPassword,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post("${USERS_URL}/${user.id.value}/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin())
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val parsedResult =
            objectMapper.readValue(
                result.response.contentAsString,
                object : TypeReference<ValidationErrorResponse>() {},
            )

        assertEquals(2, parsedResult.errors.size)
        assertTrue(parsedResult.errors.any { it.field == "newPassword" })
        assertTrue(parsedResult.errors.any { it.field == "confirmNewPassword" })
        assertTrue(parsedResult.errors.all { it.message?.contains("match") == true })
    }

    @Test
    fun `Post - Unauthorized - when user is not logged in and tries to change his password`() {
        mockMvc
            .perform(
                post("${USERS_URL}/me/change-password")
                    .contentType(MediaType.APPLICATION_JSON),
            ).andExpect(status().isUnauthorized)
    }

    @Test
    fun `Delete - Throw not found if user does not exist`() {
        val uuid = "03cbc919-aba7-438f-9bb3-e63d32689bfa"

        val u = UserMocks.getUser(email = "whatever@example.com")
        userRepository.create(u)

        mockMvc
            .perform(
                delete("${USERS_URL}/$uuid")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockUser(userId = u.id, email = u.email)),
            ).andExpect(status().isNotFound)
    }
}

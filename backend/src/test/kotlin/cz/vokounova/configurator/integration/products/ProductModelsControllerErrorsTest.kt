package cz.vokounova.configurator.integration.products

import cz.vokounova.configurator.configuration.BaseIntegrationTest
import cz.vokounova.configurator.generated.jooq.tables.references.PRODUCT_MODEL
import cz.vokounova.configurator.mocks.AuthMocks
import cz.vokounova.configurator.mocks.ProductModelMocks
import cz.vokounova.configurator.mocks.UserMocks
import cz.vokounova.configurator.products.models.infrastructure.rest.mapper.request.ProductModelCreateRequestDto
import cz.vokounova.configurator.products.models.infrastructure.rest.mapper.request.ProductModelPatchRequestDto
import cz.vokounova.configurator.products.models.ports.inbound.ProductModelAPI
import cz.vokounova.configurator.shared.rest.response.ValidationErrorResponse
import cz.vokounova.configurator.shared.validations.BaseValidationCode
import cz.vokounova.configurator.users.api.dto.UserIdDto
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.ports.outboud.UserRepository
import org.junit.jupiter.api.Assertions.assertNotNull
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

class ProductModelsControllerErrorsTest : BaseIntegrationTest() {
    companion object {
        private const val PRODUCT_MODELS_URL = "/products/api/v1/product-models"
    }

    @Autowired
    protected lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var productModelAPI: ProductModelAPI

    @Autowired
    lateinit var userRepository: UserRepository

    private val userId0: UserId = UserId(UUID.fromString("00000000-0000-0000-0000-000000000000"))
    private val userId0Dto: UserIdDto = UserIdDto.fromDomain(userId0)

    @BeforeEach
    override fun cleanUp() {
        dslContext.truncate(PRODUCT_MODEL).cascade().execute()
        dslContext.truncate(cz.vokounova.configurator.generated.jooq.tables.references.USER).cascade().execute()
    }

    val uuid = "aefab56d-2c61-4a5d-a8fa-f3790ec8c8c3"

    @Test
    fun `Get - Unauthorized - when authentication is missing`() {
        mockMvc
            .perform(
                get(PRODUCT_MODELS_URL)
                    .contentType(MediaType.APPLICATION_JSON),
            ).andExpect(status().isUnauthorized)
    }

    @Test
    fun `Get - NotFound - when product model does not exist`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val nonExistentId = UUID.randomUUID()

        mockMvc
            .perform(
                get("$PRODUCT_MODELS_URL/$nonExistentId")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isNotFound)
    }

    @Test
    fun `Create - BadRequest - when name is null`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val params =
            ProductModelCreateRequestDto(
                name = "",
                description = null,
                price = null,
                currency = null,
                isActive = null,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post(PRODUCT_MODELS_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val errors = readResponse<ValidationErrorResponse>(result)
        assertNotNull(errors.errors)
        assertTrue(errors.errors.any { it.code == BaseValidationCode.FIELD_IS_EMPTY.name })
    }

    @Test
    fun `Create - BadRequest - when name is empty`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val params =
            ProductModelCreateRequestDto(
                name = "   ",
                description = null,
                price = null,
                currency = null,
                isActive = null,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post(PRODUCT_MODELS_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val errors = readResponse<ValidationErrorResponse>(result)
        assertNotNull(errors.errors)
        assertTrue(errors.errors.any { it.code == BaseValidationCode.FIELD_IS_EMPTY.name })
    }

    @Test
    fun `Create - BadRequest - when price is negative`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val params =
            ProductModelCreateRequestDto(
                name = "Test Product",
                description = null,
                price = -100.00,
                currency = null,
                isActive = null,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post(PRODUCT_MODELS_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val errors = readResponse<ValidationErrorResponse>(result)
        assertNotNull(errors.errors)
        assertTrue(errors.errors.any { it.code == BaseValidationCode.VALUE_TOO_SMALL.name })
    }

    @Test
    fun `Patch - BadRequest - when name is null`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val createParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        val created = productModelAPI.create(createParams)

        val params =
            listOf(
                ProductModelPatchRequestDto(
                    path = ProductModelPatchRequestDto.Path.SlashName,
                    value = null,
                    op = ProductModelPatchRequestDto.Op.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    patch("$PRODUCT_MODELS_URL/${created.id.value}")
                        .contentType("application/json-patch+json")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val errors = readResponse<ValidationErrorResponse>(result)
        assertNotNull(errors.errors)
        assertTrue(errors.errors.any { it.code == BaseValidationCode.FIELD_IS_NULL.name })
    }

    @Test
    fun `Patch - BadRequest - when name is empty`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val createParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        val created = productModelAPI.create(createParams)

        val params =
            listOf(
                ProductModelPatchRequestDto(
                    path = ProductModelPatchRequestDto.Path.SlashName,
                    value = "",
                    op = ProductModelPatchRequestDto.Op.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    patch("$PRODUCT_MODELS_URL/${created.id.value}")
                        .contentType("application/json-patch+json")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val errors = readResponse<ValidationErrorResponse>(result)
        assertNotNull(errors.errors)
        assertTrue(errors.errors.any { it.code == BaseValidationCode.FIELD_IS_EMPTY.name })
    }

    @Test
    fun `Patch - BadRequest - when price is negative`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val createParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        val created = productModelAPI.create(createParams)

        val params =
            listOf(
                ProductModelPatchRequestDto(
                    path = ProductModelPatchRequestDto.Path.SlashPrice,
                    value = -50.00,
                    op = ProductModelPatchRequestDto.Op.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    patch("$PRODUCT_MODELS_URL/${created.id.value}")
                        .contentType("application/json-patch+json")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val errors = readResponse<ValidationErrorResponse>(result)
        assertNotNull(errors.errors)
        assertTrue(errors.errors.any { it.code == BaseValidationCode.VALUE_TOO_SMALL.name })
    }

    @Test
    fun `Patch - BadRequest - when currency is null`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val createParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        val created = productModelAPI.create(createParams)

        val params =
            listOf(
                ProductModelPatchRequestDto(
                    path = ProductModelPatchRequestDto.Path.SlashCurrency,
                    value = null,
                    op = ProductModelPatchRequestDto.Op.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    patch("$PRODUCT_MODELS_URL/${created.id.value}")
                        .contentType("application/json-patch+json")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val errors = readResponse<ValidationErrorResponse>(result)
        assertNotNull(errors.errors)
        assertTrue(errors.errors.any { it.code == BaseValidationCode.FIELD_IS_NULL.name })
    }

    @Test
    fun `Patch - BadRequest - when currency is empty`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val createParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        val created = productModelAPI.create(createParams)

        val params =
            listOf(
                ProductModelPatchRequestDto(
                    path = ProductModelPatchRequestDto.Path.SlashCurrency,
                    value = "",
                    op = ProductModelPatchRequestDto.Op.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    patch("$PRODUCT_MODELS_URL/${created.id.value}")
                        .contentType("application/json-patch+json")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val errors = readResponse<ValidationErrorResponse>(result)
        assertNotNull(errors.errors)
        assertTrue(errors.errors.any { it.code == BaseValidationCode.FIELD_IS_EMPTY.name })
    }

    @Test
    fun `Patch - BadRequest - when isActive is null`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val createParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        val created = productModelAPI.create(createParams)

        val params =
            listOf(
                ProductModelPatchRequestDto(
                    path = ProductModelPatchRequestDto.Path.SlashIsActive,
                    value = null,
                    op = ProductModelPatchRequestDto.Op.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    patch("$PRODUCT_MODELS_URL/${created.id.value}")
                        .contentType("application/json-patch+json")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val errors = readResponse<ValidationErrorResponse>(result)
        assertNotNull(errors.errors)
        assertTrue(errors.errors.any { it.code == BaseValidationCode.FIELD_IS_NULL.name })
    }

    @Test
    fun `Patch - NotFound - when product model does not exist`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val nonExistentId = UUID.randomUUID()

        val params =
            listOf(
                ProductModelPatchRequestDto(
                    path = ProductModelPatchRequestDto.Path.SlashName,
                    value = "New Name",
                    op = ProductModelPatchRequestDto.Op.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        mockMvc
            .perform(
                patch("$PRODUCT_MODELS_URL/$nonExistentId")
                    .contentType("application/json-patch+json")
                    .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                    .content(payload),
            ).andExpect(status().isNotFound)
    }

    @Test
    fun `Delete - NotFound - when product model does not exist`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val nonExistentId = UUID.randomUUID()

        mockMvc
            .perform(
                delete("$PRODUCT_MODELS_URL/$nonExistentId")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockUser(userId = user.id, email = user.email)),
            ).andExpect(status().isNotFound)
    }

    @Test
    fun `List - BadRequest - when limit is less than 1`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val result =
            mockMvc
                .perform(
                    get(PRODUCT_MODELS_URL)
                        .param("limit", "0")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val errors = readResponse<ValidationErrorResponse>(result)
        assertNotNull(errors.errors)
        assertTrue(errors.errors.any { it.code == BaseValidationCode.VALUE_TOO_SMALL.name })
    }

    @Test
    fun `List - BadRequest - when orderBy field is invalid`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val result =
            mockMvc
                .perform(
                    get(PRODUCT_MODELS_URL)
                        .param("orderBy", "invalidField")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val errors = readResponse<ValidationErrorResponse>(result)
        assertNotNull(errors.errors)
    }

    @Test
    fun `List - BadRequest - when less fields in after cursor than in order by`() {
        val cursor =
            "{" +
                "  \"name\": \"Test Product\",\n" +
                "  \"id\": \"$uuid\"" +
                "}"
        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray())

        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        mockMvc
            .perform(
                get(PRODUCT_MODELS_URL)
                    .param("orderBy", "name,price")
                    .param("after", encodedCursor)
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isBadRequest)
    }

    @Test
    fun `List - BadRequest - when more fields in after cursor than in order by`() {
        val cursor =
            "{" +
                "  \"name\": \"Test Product\",\n" +
                "  \"price\": \"1000\",\n" +
                "  \"id\": \"$uuid\"" +
                "}"
        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray())

        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        mockMvc
            .perform(
                get(PRODUCT_MODELS_URL)
                    .param("orderBy", "name")
                    .param("after", encodedCursor)
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isBadRequest)
    }

    @Test
    fun `List - BadRequest - when different fields in after cursor than in order by`() {
        val cursor =
            "{" +
                "  \"name\": \"Test Product\",\n" +
                "  \"id\": \"$uuid\"" +
                "}"
        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray())

        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        mockMvc
            .perform(
                get(PRODUCT_MODELS_URL)
                    .param("orderBy", "price,currency")
                    .param("after", encodedCursor)
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isBadRequest)
    }
}

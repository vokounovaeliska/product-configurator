package cz.vokounova.configurator.integration.products.models

import cz.vokounova.configurator.configuration.BaseIntegrationTest
import cz.vokounova.configurator.generated.jooq.tables.references.PRODUCT_MODEL
import cz.vokounova.configurator.generated.jooq.tables.references.USER
import cz.vokounova.configurator.mocks.AuthMocks
import cz.vokounova.configurator.mocks.ProductModelMocks
import cz.vokounova.configurator.mocks.UserMocks
import cz.vokounova.configurator.products.models.infrastructure.rest.mapper.request.ProductModelCreateRequestDto
import cz.vokounova.configurator.products.models.infrastructure.rest.mapper.request.ProductModelPatchRequestDto
import cz.vokounova.configurator.products.models.infrastructure.rest.mapper.response.ProductModelDto
import cz.vokounova.configurator.products.models.infrastructure.rest.mapper.response.ProductModelPaginatedResponseDto
import cz.vokounova.configurator.products.models.ports.inbound.ProductModelAPI
import cz.vokounova.configurator.users.api.dto.UserIdDto
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.ports.outbound.UserRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
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
import java.util.UUID

class ProductModelsControllerTest : BaseIntegrationTest() {
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
    private val userId1: UserId = UserId(UUID.fromString("11111111-1111-1111-1111-111111111111"))
    private val userId0Dto: UserIdDto = UserIdDto.fromDomain(userId0)
    private val userId1Dto: UserIdDto = UserIdDto.fromDomain(userId1)

    @BeforeEach
    override fun cleanUp() {
        dslContext.truncate(PRODUCT_MODEL).cascade().execute()
        dslContext.truncate(USER).cascade().execute()
    }

    @Test
    fun `Get - Returns single product model`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val createParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        val created = productModelAPI.create(createParams)

        val result =
            mockMvc
                .perform(
                    get("$PRODUCT_MODELS_URL/${created.id.value}")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email)),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<ProductModelDto>(result)

        assertNotNull(parsedResult)
        assertEquals(created.id.value, parsedResult.id)
        assertEquals(created.userId.value, parsedResult.userId)
        assertEquals(created.name, parsedResult.name)
        assertEquals(created.description, parsedResult.description)
        assertEquals(created.price, parsedResult.price)
        assertEquals(created.currency, parsedResult.currency)
        assertEquals(created.isActive, parsedResult.isActive)
        assertNotNull(parsedResult.createdAt)
        assertNotNull(parsedResult.modifiedAt)
    }

    @Test
    fun `Create - creates product model`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val params =
            ProductModelCreateRequestDto(
                name = "Test Table",
                description = "A test table",
                price = 1500.00,
                currency = "CZK",
                isActive = true,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post(PRODUCT_MODELS_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isCreated)
                .andReturn()

        val parsedResult = readResponse<ProductModelDto>(result)

        assertNotNull(parsedResult)
        assertNotNull(parsedResult.id)
        assertEquals(params.name, parsedResult.name)
        assertEquals(params.description, parsedResult.description)
        assertEquals(params.price, parsedResult.price)
        assertEquals(params.currency, parsedResult.currency)
        assertEquals(params.isActive, parsedResult.isActive)
        assertEquals(user.id.value, parsedResult.userId)
        assertNotNull(parsedResult.createdAt)
        assertNotNull(parsedResult.modifiedAt)
    }

    @Test
    fun `Create - uses default values when optional fields are null`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val params =
            ProductModelCreateRequestDto(
                name = "Minimal Product",
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
                ).andExpect(status().isCreated)
                .andReturn()

        val parsedResult = readResponse<ProductModelDto>(result)

        assertNotNull(parsedResult)
        assertEquals(params.name, parsedResult.name)
        assertEquals(null, parsedResult.description)
        assertEquals(0.0, parsedResult.price)
        assertEquals("CZK", parsedResult.currency)
        assertEquals(true, parsedResult.isActive)
    }

    @Test
    fun `Delete - Delete product model`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val createParams1 = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        val created1 = productModelAPI.create(createParams1)

        val createParams2 = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto, name = "Another Product")
        val created2 = productModelAPI.create(createParams2)

        assertEquals(2, productModelAPI.getList().size)

        mockMvc
            .perform(
                delete("$PRODUCT_MODELS_URL/${created1.id.value}")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockUser(userId = user.id, email = user.email)),
            ).andExpect(status().isNoContent)

        assertEquals(1, productModelAPI.getList().size)
    }

    @Test
    fun `Patch - partial update of product model`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val createParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        val created = productModelAPI.create(createParams)

        val newName = "Updated Product Name"
        val newDescription = "Updated description"
        val newPrice = 2000.50

        val params =
            listOf(
                ProductModelPatchRequestDto(
                    path = ProductModelPatchRequestDto.Path.SlashName,
                    value = newName,
                    op = ProductModelPatchRequestDto.Op.Replace,
                ),
                ProductModelPatchRequestDto(
                    path = ProductModelPatchRequestDto.Path.SlashDescription,
                    value = newDescription,
                    op = ProductModelPatchRequestDto.Op.Replace,
                ),
                ProductModelPatchRequestDto(
                    path = ProductModelPatchRequestDto.Path.SlashPrice,
                    value = newPrice,
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
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<ProductModelDto>(result)

        assertEquals(newName, parsedResult.name)
        assertEquals(newDescription, parsedResult.description)
        assertEquals(newPrice, parsedResult.price)
        assertEquals(created.currency, parsedResult.currency)
        assertEquals(created.isActive, parsedResult.isActive)
    }

    @Test
    fun `Get - Returns paginated list of product models`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val createParams1 = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto, name = "Product 1")
        productModelAPI.create(createParams1)

        val createParams2 = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto, name = "Product 2")
        productModelAPI.create(createParams2)

        val result =
            mockMvc
                .perform(
                    get(PRODUCT_MODELS_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("limit", "10")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email)),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<ProductModelPaginatedResponseDto>(result)

        assertNotNull(parsedResult)
        assertNotNull(parsedResult.items)
        assertEquals(2, parsedResult.items.size)
        assertNotNull(parsedResult.pageMetadata)
    }

    @Test
    fun `Get - Returns only the authenticated user's product models`() {
        val user1 = UserMocks.getUser(id = userId0, email = "user1@email.com")
        val user2 = UserMocks.getUser(id = userId1, email = "user2@email.com")
        userRepository.create(user1)
        userRepository.create(user2)

        val createParams1 = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto, name = "User1 Product")
        productModelAPI.create(createParams1)

        val createParams2 = ProductModelMocks.getProductModelCreateParams(userId = userId1Dto, name = "User2 Product")
        productModelAPI.create(createParams2)

        val result =
            mockMvc
                .perform(
                    get(PRODUCT_MODELS_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("limit", "10")
                        .with(AuthMocks.mockUser(userId = user2.id, email = user2.email)),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<ProductModelPaginatedResponseDto>(result)

        assertNotNull(parsedResult)
        assertEquals(1, parsedResult.items.size)
        assertEquals(userId1Dto.value, parsedResult.items.first().userId)
    }

    @Test
    fun `Get - Filters product models by isActive`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val activeParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto, name = "Active Product", isActive = true)
        productModelAPI.create(activeParams)

        val inactiveParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto, name = "Inactive Product", isActive = false)
        productModelAPI.create(inactiveParams)

        val result =
            mockMvc
                .perform(
                    get(PRODUCT_MODELS_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("limit", "10")
                        .param("isActive", "true")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email)),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<ProductModelPaginatedResponseDto>(result)

        assertNotNull(parsedResult)
        assertEquals(1, parsedResult.items.size)
        assertEquals(true, parsedResult.items.first().isActive)
    }
}

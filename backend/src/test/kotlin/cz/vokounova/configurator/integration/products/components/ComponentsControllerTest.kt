package cz.vokounova.configurator.integration.products.components

import cz.vokounova.configurator.configuration.BaseIntegrationTest
import cz.vokounova.configurator.generated.jooq.tables.references.COMPONENT_DEFINITION
import cz.vokounova.configurator.generated.jooq.tables.references.PRODUCT_MODEL
import cz.vokounova.configurator.generated.jooq.tables.references.USER
import cz.vokounova.configurator.mocks.AuthMocks
import cz.vokounova.configurator.mocks.ComponentMocks
import cz.vokounova.configurator.mocks.ProductModelMocks
import cz.vokounova.configurator.mocks.UserMocks
import cz.vokounova.configurator.products.components.domain.ComponentId
import cz.vokounova.configurator.products.components.infrastructure.rest.mapper.request.ComponentCreateRequestDto
import cz.vokounova.configurator.products.components.infrastructure.rest.mapper.request.ComponentPatchRequestDto
import cz.vokounova.configurator.products.components.infrastructure.rest.mapper.request.ComponentPatchRequestDtoOp
import cz.vokounova.configurator.products.components.infrastructure.rest.mapper.request.ComponentPatchRequestDtoPath
import cz.vokounova.configurator.products.components.infrastructure.rest.mapper.response.ComponentDto
import cz.vokounova.configurator.products.components.infrastructure.rest.mapper.response.ComponentPaginatedResponseDto
import cz.vokounova.configurator.products.components.ports.inbound.ComponentAPI
import cz.vokounova.configurator.products.models.ports.inbound.ProductModelAPI
import cz.vokounova.configurator.users.api.dto.UserIdDto
import cz.vokounova.configurator.users.domain.User
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

class ComponentsControllerTest : BaseIntegrationTest() {
    companion object {
        private const val COMPONENTS_URL = "/products/api/v1/product-models"
    }

    @Autowired
    protected lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var componentAPI: ComponentAPI

    @Autowired
    lateinit var productModelAPI: ProductModelAPI

    @Autowired
    lateinit var userRepository: UserRepository

    private val userId0: UserId = UserId(UUID.fromString("00000000-0000-0000-0000-000000000000"))
    private val userId0Dto: UserIdDto = UserIdDto.fromDomain(userId0)

    private lateinit var user: User

    private fun getComponent(componentId: ComponentId) = componentAPI.getOne(componentId)

    @BeforeEach
    override fun cleanUp() {
        dslContext.truncate(COMPONENT_DEFINITION).cascade().execute()
        dslContext.truncate(PRODUCT_MODEL).cascade().execute()
        dslContext.truncate(USER).cascade().execute()

        // Create user once for all tests
        user = UserMocks.getUser(id = userId0)
        userRepository.create(user)
    }

    @Test
    fun `Get - Returns single component`() {
        val productModelCreateParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        val productModel = productModelAPI.create(productModelCreateParams)

        val componentCreateParams = ComponentMocks.getComponentCreateParams(productModelId = productModel.id)
        val created = componentAPI.create(componentCreateParams)

        val result =
            mockMvc
                .perform(
                    get("$COMPONENTS_URL/${productModel.id.value}/components/${created.id.value}")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email)),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<ComponentDto>(result)

        assertNotNull(parsedResult)
        assertEquals(created.id.value, parsedResult.id)
        assertEquals(created.productModelId.value, parsedResult.productModelId)
        assertEquals(created.code, parsedResult.code)
        assertEquals(created.label, parsedResult.label)
        assertEquals(created.description, parsedResult.description)
        assertEquals(created.sortOrder, parsedResult.sortOrder)
        assertEquals(created.imageZIndex, parsedResult.imageZIndex)
        assertNotNull(parsedResult.createdAt)
        assertNotNull(parsedResult.modifiedAt)
    }

    @Test
    fun `Create - creates component`() {
        val productModelCreateParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        val productModel = productModelAPI.create(productModelCreateParams)

        val params =
            ComponentCreateRequestDto(
                code = "TOP",
                label = "Table Top",
                description = "The top surface of the table",
                sortOrder = 1,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post("$COMPONENTS_URL/${productModel.id.value}/components")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isCreated)
                .andReturn()

        val parsedResult = readResponse<ComponentDto>(result)

        assertNotNull(parsedResult)
        assertNotNull(parsedResult.id)
        assertEquals(params.code, parsedResult.code)
        assertEquals(params.label, parsedResult.label)
        assertEquals(params.description, parsedResult.description)
        assertEquals(params.sortOrder, parsedResult.sortOrder)
        assertEquals(productModel.id.value, parsedResult.productModelId)
        assertNotNull(parsedResult.createdAt)
        assertNotNull(parsedResult.modifiedAt)
    }

    @Test
    fun `Create - uses default values when optional fields are null`() {
        val productModelCreateParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        val productModel = productModelAPI.create(productModelCreateParams)

        val params =
            ComponentCreateRequestDto(
                code = "LEGS",
                label = "Table Legs",
                description = null,
                sortOrder = null,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post("$COMPONENTS_URL/${productModel.id.value}/components")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isCreated)
                .andReturn()

        val parsedResult = readResponse<ComponentDto>(result)

        assertNotNull(parsedResult)
        assertEquals(params.code, parsedResult.code)
        assertEquals(params.label, parsedResult.label)
        assertEquals(null, parsedResult.description)
        assertEquals(0, parsedResult.sortOrder)
        assertEquals(0, parsedResult.imageZIndex)
    }

    @Test
    fun `Delete - Delete component`() {
        val productModelCreateParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        val productModel = productModelAPI.create(productModelCreateParams)

        val componentCreateParams1 = ComponentMocks.getComponentCreateParams(productModelId = productModel.id, code = "TOP")
        val created1 = componentAPI.create(componentCreateParams1)

        val componentCreateParams2 = ComponentMocks.getComponentCreateParams(productModelId = productModel.id, code = "LEGS")
        val created2 = componentAPI.create(componentCreateParams2)

        assertEquals(2, componentAPI.getList().size)

        mockMvc
            .perform(
                delete("$COMPONENTS_URL/${productModel.id.value}/components/${created1.id.value}")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockUser(userId = user.id, email = user.email)),
            ).andExpect(status().isNoContent)

        assertEquals(1, componentAPI.getList().size)
    }

    @Test
    fun `Patch - partial update of component`() {
        val productModelCreateParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        val productModel = productModelAPI.create(productModelCreateParams)

        val componentCreateParams = ComponentMocks.getComponentCreateParams(productModelId = productModel.id)
        val created = componentAPI.create(componentCreateParams)

        val newCode = "UPDATED_CODE"
        val newLabel = "Updated Label"
        val newDescription = "Updated description"
        val newSortOrder = 5

        val params =
            listOf(
                ComponentPatchRequestDto(
                    path = ComponentPatchRequestDtoPath.SlashCode,
                    value = newCode,
                    op = ComponentPatchRequestDtoOp.Replace,
                ),
                ComponentPatchRequestDto(
                    path = ComponentPatchRequestDtoPath.SlashLabel,
                    value = newLabel,
                    op = ComponentPatchRequestDtoOp.Replace,
                ),
                ComponentPatchRequestDto(
                    path = ComponentPatchRequestDtoPath.SlashDescription,
                    value = newDescription,
                    op = ComponentPatchRequestDtoOp.Replace,
                ),
                ComponentPatchRequestDto(
                    path = ComponentPatchRequestDtoPath.SlashSortOrder,
                    value = newSortOrder,
                    op = ComponentPatchRequestDtoOp.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    patch("$COMPONENTS_URL/${productModel.id.value}/components/${created.id.value}")
                        .contentType("application/json-patch+json")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<ComponentDto>(result)

        assertEquals(newCode, parsedResult.code)
        assertEquals(newLabel, parsedResult.label)
        assertEquals(newDescription, parsedResult.description)
        assertEquals(newSortOrder, parsedResult.sortOrder)
        assertEquals(created.productModelId.value, parsedResult.productModelId)

        val updatedComponent = getComponent(created.id)
        assertNotNull(updatedComponent.modifiedAt)
    }

    @Test
    fun `Get - Returns paginated list of components`() {
        val productModelCreateParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        val productModel = productModelAPI.create(productModelCreateParams)

        val componentCreateParams1 = ComponentMocks.getComponentCreateParams(productModelId = productModel.id, code = "TOP", sortOrder = 1)
        componentAPI.create(componentCreateParams1)

        val componentCreateParams2 = ComponentMocks.getComponentCreateParams(productModelId = productModel.id, code = "LEGS", sortOrder = 2)
        componentAPI.create(componentCreateParams2)

        val result =
            mockMvc
                .perform(
                    get("$COMPONENTS_URL/${productModel.id.value}/components")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("limit", "10")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email)),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<ComponentPaginatedResponseDto>(result)

        assertNotNull(parsedResult)
        assertNotNull(parsedResult.items)
        assertEquals(2, parsedResult.items.size)
        assertNotNull(parsedResult.pageMetadata)
    }

    @Test
    fun `Get - Filters components by productModelId`() {
        val productModelCreateParams1 = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto, name = "Model 1")
        val productModel1 = productModelAPI.create(productModelCreateParams1)

        val productModelCreateParams2 = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto, name = "Model 2")
        val productModel2 = productModelAPI.create(productModelCreateParams2)

        val componentCreateParams1 = ComponentMocks.getComponentCreateParams(productModelId = productModel1.id, code = "TOP")
        componentAPI.create(componentCreateParams1)

        val componentCreateParams2 = ComponentMocks.getComponentCreateParams(productModelId = productModel2.id, code = "LEGS")
        componentAPI.create(componentCreateParams2)

        val result =
            mockMvc
                .perform(
                    get("$COMPONENTS_URL/${productModel1.id.value}/components")
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("limit", "10")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email)),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<ComponentPaginatedResponseDto>(result)

        assertNotNull(parsedResult)
        assertEquals(1, parsedResult.items.size)
        assertEquals(productModel1.id.value, parsedResult.items.first().productModelId)
    }
}

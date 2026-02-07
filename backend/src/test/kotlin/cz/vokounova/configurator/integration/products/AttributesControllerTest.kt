package cz.vokounova.configurator.integration.products

import cz.vokounova.configurator.configuration.BaseIntegrationTest
import cz.vokounova.configurator.generated.jooq.enums.AttributeType
import cz.vokounova.configurator.generated.jooq.tables.references.ATTRIBUTE_DEFINITION
import cz.vokounova.configurator.generated.jooq.tables.references.ATTRIBUTE_OPTION
import cz.vokounova.configurator.generated.jooq.tables.references.COMPONENT_DEFINITION
import cz.vokounova.configurator.generated.jooq.tables.references.PRODUCT_MODEL
import cz.vokounova.configurator.generated.jooq.tables.references.USER
import cz.vokounova.configurator.mocks.AttributeMocks
import cz.vokounova.configurator.mocks.AuthMocks
import cz.vokounova.configurator.mocks.ComponentMocks
import cz.vokounova.configurator.mocks.ProductModelMocks
import cz.vokounova.configurator.mocks.UserMocks
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request.AttributeCreateRequestDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request.AttributePatchRequestDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request.AttributePatchRequestDtoOp
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request.AttributePatchRequestDtoPath
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.response.AttributeDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.response.AttributePaginatedResponseDto
import cz.vokounova.configurator.products.attributes.ports.inbound.AttributeAPI
import cz.vokounova.configurator.products.components.ports.inbound.ComponentAPI
import cz.vokounova.configurator.products.models.ports.inbound.ProductModelAPI
import cz.vokounova.configurator.users.api.dto.UserIdDto
import cz.vokounova.configurator.users.domain.User
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.ports.outboud.UserRepository
import org.junit.jupiter.api.Assertions.assertEquals
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
import java.math.BigDecimal
import java.util.UUID

class AttributesControllerTest : BaseIntegrationTest() {
    companion object {
        private const val ATTRIBUTES_URL = "/products/api/v1/product-models"
    }

    @Autowired
    protected lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var attributeAPI: AttributeAPI

    @Autowired
    lateinit var componentAPI: ComponentAPI

    @Autowired
    lateinit var productModelAPI: ProductModelAPI

    @Autowired
    lateinit var userRepository: UserRepository

    private val userId0: UserId = UserId(UUID.fromString("00000000-0000-0000-0000-000000000000"))
    private val userId0Dto: UserIdDto = UserIdDto.fromDomain(userId0)

    private lateinit var user: User
    private lateinit var productModel: cz.vokounova.configurator.products.models.domain.ProductModel
    private lateinit var component: cz.vokounova.configurator.products.components.domain.Component

    @BeforeEach
    override fun cleanUp() {
        dslContext.truncate(ATTRIBUTE_OPTION).cascade().execute()
        dslContext.truncate(ATTRIBUTE_DEFINITION).cascade().execute()
        dslContext.truncate(COMPONENT_DEFINITION).cascade().execute()
        dslContext.truncate(PRODUCT_MODEL).cascade().execute()
        dslContext.truncate(USER).cascade().execute()

        // Create user once for all tests
        user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        // Create product model and component for all tests
        val productModelCreateParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        productModel = productModelAPI.create(productModelCreateParams)

        val componentCreateParams = ComponentMocks.getComponentCreateParams(productModelId = productModel.id)
        component = componentAPI.create(componentCreateParams)
    }

    @Test
    fun `Get - Returns single attribute`() {
        val attributeCreateParams = AttributeMocks.getAttributeCreateParams(componentId = component.id)
        val created = attributeAPI.create(attributeCreateParams)

        val result =
            mockMvc
                .perform(
                    get("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes/${created.id.value}")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<AttributeDto>(result)

        assertNotNull(parsedResult)
        assertEquals(created.id.value, parsedResult.id)
        assertEquals(created.componentId.value, parsedResult.componentId)
        assertEquals(created.code, parsedResult.code)
        assertEquals(created.label, parsedResult.label)
        assertEquals(created.type, parsedResult.type)
        assertEquals(created.isRequired, parsedResult.isRequired)
        assertEquals(created.minInt, parsedResult.minInt)
        assertEquals(created.maxInt, parsedResult.maxInt)
        assertEquals(created.minDecimal, parsedResult.minDecimal)
        assertEquals(created.maxDecimal, parsedResult.maxDecimal)
        assertEquals(created.sortOrder, parsedResult.sortOrder)
        assertNotNull(parsedResult.createdAt)
        assertNotNull(parsedResult.modifiedAt)
    }

    @Test
    fun `Create - creates INTEGER attribute`() {
        val params =
            AttributeCreateRequestDto(
                code = "WIDTH",
                label = "Width",
                type = AttributeType.INTEGER,
                isRequired = true,
                minInt = 800,
                maxInt = 2000,
                sortOrder = 1,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isCreated)
                .andReturn()

        val parsedResult = readResponse<AttributeDto>(result)

        assertNotNull(parsedResult)
        assertNotNull(parsedResult.id)
        assertEquals(params.code, parsedResult.code)
        assertEquals(params.label, parsedResult.label)
        assertEquals(params.type, parsedResult.type)
        assertEquals(params.isRequired, parsedResult.isRequired)
        assertEquals(params.minInt, parsedResult.minInt)
        assertEquals(params.maxInt, parsedResult.maxInt)
        assertEquals(component.id.value, parsedResult.componentId)
        assertNotNull(parsedResult.createdAt)
        assertNotNull(parsedResult.modifiedAt)
    }

    @Test
    fun `Create - creates ENUM attribute`() {
        val params =
            AttributeCreateRequestDto(
                code = "COLOR",
                label = "Color",
                type = AttributeType.ENUM,
                isRequired = true,
                sortOrder = 1,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isCreated)
                .andReturn()

        val parsedResult = readResponse<AttributeDto>(result)

        assertNotNull(parsedResult)
        assertEquals(params.code, parsedResult.code)
        assertEquals(params.type, parsedResult.type)
        assertEquals(null, parsedResult.minInt)
        assertEquals(null, parsedResult.maxInt)
    }

    @Test
    fun `Create - creates DECIMAL attribute`() {
        val params =
            AttributeCreateRequestDto(
                code = "DEPTH",
                label = "Depth",
                type = AttributeType.DECIMAL,
                isRequired = true,
                minDecimal = BigDecimal("30.0"),
                maxDecimal = BigDecimal("60.0"),
                sortOrder = 1,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isCreated)
                .andReturn()

        val parsedResult = readResponse<AttributeDto>(result)

        assertNotNull(parsedResult)
        assertEquals(params.code, parsedResult.code)
        assertEquals(params.type, parsedResult.type)
        assertEquals(params.minDecimal, parsedResult.minDecimal)
        assertEquals(params.maxDecimal, parsedResult.maxDecimal)
    }

    @Test
    fun `Create - uses default values when optional fields are null`() {
        val params =
            AttributeCreateRequestDto(
                code = "HEIGHT",
                label = "Height",
                type = AttributeType.INTEGER,
                isRequired = null,
                minInt = null,
                maxInt = null,
                sortOrder = null,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isCreated)
                .andReturn()

        val parsedResult = readResponse<AttributeDto>(result)

        assertNotNull(parsedResult)
        assertEquals(true, parsedResult.isRequired) // default value
        assertEquals(0, parsedResult.sortOrder) // default value
    }

    @Test
    fun `List - returns paginated attributes`() {
        val attribute1 =
            attributeAPI.create(
                AttributeMocks.getAttributeCreateParams(
                    componentId = component.id,
                    code = "WIDTH",
                    sortOrder = 1,
                ),
            )
        val attribute2 =
            attributeAPI.create(
                AttributeMocks.getAttributeCreateParams(
                    componentId = component.id,
                    code = "HEIGHT",
                    sortOrder = 2,
                ),
            )

        val result =
            mockMvc
                .perform(
                    get("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<AttributePaginatedResponseDto>(result)

        assertNotNull(parsedResult)
        assertEquals(2, parsedResult.items.size)
        assertEquals(attribute1.id.value, parsedResult.items[0].id)
        assertEquals(attribute2.id.value, parsedResult.items[1].id)
    }

    @Test
    fun `Patch - updates attribute label`() {
        val attribute =
            attributeAPI.create(
                AttributeMocks.getAttributeCreateParams(componentId = component.id),
            )

        val patchParams =
            listOf(
                AttributePatchRequestDto(
                    path = AttributePatchRequestDtoPath.SlashLabel,
                    value = "Updated Label",
                    op = AttributePatchRequestDtoOp.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(patchParams)

        val result =
            mockMvc
                .perform(
                    patch("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes/${attribute.id.value}")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<AttributeDto>(result)

        assertEquals("Updated Label", parsedResult.label)
        assertEquals(attribute.code, parsedResult.code) // unchanged
    }

    @Test
    fun `Create - creates BOOLEAN attribute`() {
        val params =
            AttributeCreateRequestDto(
                code = "IS_AVAILABLE",
                label = "Is Available",
                type = AttributeType.BOOLEAN,
                isRequired = true,
                sortOrder = 1,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isCreated)
                .andReturn()

        val parsedResult = readResponse<AttributeDto>(result)

        assertNotNull(parsedResult)
        assertEquals(params.code, parsedResult.code)
        assertEquals(params.type, parsedResult.type)
        assertEquals(null, parsedResult.minInt)
        assertEquals(null, parsedResult.maxInt)
        assertEquals(null, parsedResult.minDecimal)
        assertEquals(null, parsedResult.maxDecimal)
    }

    @Test
    fun `List - filters by ids`() {
        val attribute1 =
            attributeAPI.create(
                AttributeMocks.getAttributeCreateParams(
                    componentId = component.id,
                    code = "WIDTH",
                ),
            )
        val attribute2 =
            attributeAPI.create(
                AttributeMocks.getAttributeCreateParams(
                    componentId = component.id,
                    code = "HEIGHT",
                ),
            )
        attributeAPI.create(
            AttributeMocks.getAttributeCreateParams(
                componentId = component.id,
                code = "DEPTH",
            ),
        )

        val result =
            mockMvc
                .perform(
                    get("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes")
                        .param("ids", attribute1.id.value.toString())
                        .param("ids", attribute2.id.value.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<AttributePaginatedResponseDto>(result)

        assertNotNull(parsedResult)
        assertEquals(2, parsedResult.items.size)
        assertTrue(parsedResult.items.any { it.id == attribute1.id.value })
        assertTrue(parsedResult.items.any { it.id == attribute2.id.value })
    }

    @Test
    fun `List - filters by types`() {
        attributeAPI.create(
            AttributeMocks.getAttributeCreateParams(
                componentId = component.id,
                code = "WIDTH",
                type = AttributeType.INTEGER,
            ),
        )
        attributeAPI.create(
            AttributeMocks.getAttributeCreateParams(
                componentId = component.id,
                code = "COLOR",
                type = AttributeType.ENUM,
                minInt = null,
                maxInt = null,
                minDecimal = null,
                maxDecimal = null,
            ),
        )
        val decimalAttribute =
            attributeAPI.create(
                AttributeMocks.getAttributeCreateParams(
                    componentId = component.id,
                    code = "DEPTH",
                    type = AttributeType.DECIMAL,
                    minInt = null,
                    maxInt = null,
                ),
            )

        val result =
            mockMvc
                .perform(
                    get("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes")
                        .param("types", AttributeType.DECIMAL.name)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<AttributePaginatedResponseDto>(result)

        assertNotNull(parsedResult)
        assertEquals(1, parsedResult.items.size)
        assertEquals(decimalAttribute.id.value, parsedResult.items[0].id)
        assertEquals(AttributeType.DECIMAL, parsedResult.items[0].type)
    }

    @Test
    fun `List - respects limit parameter`() {
        attributeAPI.create(
            AttributeMocks.getAttributeCreateParams(
                componentId = component.id,
                code = "WIDTH",
                sortOrder = 1,
            ),
        )
        attributeAPI.create(
            AttributeMocks.getAttributeCreateParams(
                componentId = component.id,
                code = "HEIGHT",
                sortOrder = 2,
            ),
        )
        attributeAPI.create(
            AttributeMocks.getAttributeCreateParams(
                componentId = component.id,
                code = "DEPTH",
                sortOrder = 3,
            ),
        )

        val result =
            mockMvc
                .perform(
                    get("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes")
                        .param("limit", "2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<AttributePaginatedResponseDto>(result)

        assertNotNull(parsedResult)
        assertEquals(2, parsedResult.items.size)
    }

    @Test
    fun `List - sorts by sortOrder ascending`() {
        val attribute3 =
            attributeAPI.create(
                AttributeMocks.getAttributeCreateParams(
                    componentId = component.id,
                    code = "WIDTH",
                    sortOrder = 3,
                ),
            )
        val attribute1 =
            attributeAPI.create(
                AttributeMocks.getAttributeCreateParams(
                    componentId = component.id,
                    code = "HEIGHT",
                    sortOrder = 1,
                ),
            )
        val attribute2 =
            attributeAPI.create(
                AttributeMocks.getAttributeCreateParams(
                    componentId = component.id,
                    code = "DEPTH",
                    sortOrder = 2,
                ),
            )

        val result =
            mockMvc
                .perform(
                    get("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes")
                        .param("orderBy", "sortOrder")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<AttributePaginatedResponseDto>(result)

        assertNotNull(parsedResult)
        assertEquals(3, parsedResult.items.size)
        assertEquals(attribute1.id.value, parsedResult.items[0].id)
        assertEquals(attribute2.id.value, parsedResult.items[1].id)
        assertEquals(attribute3.id.value, parsedResult.items[2].id)
    }

    @Test
    fun `Patch - updates multiple fields`() {
        val attribute =
            attributeAPI.create(
                AttributeMocks.getAttributeCreateParams(
                    componentId = component.id,
                    code = "WIDTH",
                    label = "Width",
                    isRequired = true,
                    sortOrder = 1,
                ),
            )

        val patchParams =
            listOf(
                AttributePatchRequestDto(
                    path = AttributePatchRequestDtoPath.SlashLabel,
                    value = "Updated Width",
                    op = AttributePatchRequestDtoOp.Replace,
                ),
                AttributePatchRequestDto(
                    path = AttributePatchRequestDtoPath.SlashIsRequired,
                    value = false,
                    op = AttributePatchRequestDtoOp.Replace,
                ),
                AttributePatchRequestDto(
                    path = AttributePatchRequestDtoPath.SlashSortOrder,
                    value = 5,
                    op = AttributePatchRequestDtoOp.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(patchParams)

        val result =
            mockMvc
                .perform(
                    patch("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes/${attribute.id.value}")
                        .contentType("application/json-patch+json")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<AttributeDto>(result)

        assertEquals("Updated Width", parsedResult.label)
        assertEquals(false, parsedResult.isRequired)
        assertEquals(5, parsedResult.sortOrder)
        assertEquals(attribute.code, parsedResult.code) // unchanged
    }

    @Test
    fun `Patch - updates code`() {
        val attribute =
            attributeAPI.create(
                AttributeMocks.getAttributeCreateParams(componentId = component.id),
            )

        val patchParams =
            listOf(
                AttributePatchRequestDto(
                    path = AttributePatchRequestDtoPath.SlashCode,
                    value = "NEW_CODE",
                    op = AttributePatchRequestDtoOp.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(patchParams)

        val result =
            mockMvc
                .perform(
                    patch("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes/${attribute.id.value}")
                        .contentType("application/json-patch+json")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<AttributeDto>(result)

        assertEquals("NEW_CODE", parsedResult.code)
    }

    @Test
    fun `Patch - updates INTEGER min and max values`() {
        val attribute =
            attributeAPI.create(
                AttributeMocks.getAttributeCreateParams(
                    componentId = component.id,
                    type = AttributeType.INTEGER,
                    minInt = 100,
                    maxInt = 200,
                ),
            )

        val patchParams =
            listOf(
                AttributePatchRequestDto(
                    path = AttributePatchRequestDtoPath.SlashMinInt,
                    value = 150,
                    op = AttributePatchRequestDtoOp.Replace,
                ),
                AttributePatchRequestDto(
                    path = AttributePatchRequestDtoPath.SlashMaxInt,
                    value = 250,
                    op = AttributePatchRequestDtoOp.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(patchParams)

        val result =
            mockMvc
                .perform(
                    patch("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes/${attribute.id.value}")
                        .contentType("application/json-patch+json")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<AttributeDto>(result)

        assertEquals(150, parsedResult.minInt)
        assertEquals(250, parsedResult.maxInt)
    }

    @Test
    fun `Patch - updates DECIMAL min and max values`() {
        val attribute =
            attributeAPI.create(
                AttributeMocks.getAttributeCreateParams(
                    componentId = component.id,
                    type = AttributeType.DECIMAL,
                    minInt = null,
                    maxInt = null,
                    minDecimal = BigDecimal("10.0"),
                    maxDecimal = BigDecimal("100.0"),
                ),
            )

        val patchParams =
            listOf(
                AttributePatchRequestDto(
                    path = AttributePatchRequestDtoPath.SlashMinDecimal,
                    value = BigDecimal("20.5"),
                    op = AttributePatchRequestDtoOp.Replace,
                ),
                AttributePatchRequestDto(
                    path = AttributePatchRequestDtoPath.SlashMaxDecimal,
                    value = BigDecimal("200.5"),
                    op = AttributePatchRequestDtoOp.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(patchParams)

        val result =
            mockMvc
                .perform(
                    patch("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes/${attribute.id.value}")
                        .contentType("application/json-patch+json")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<AttributeDto>(result)

        assertEquals(BigDecimal("20.5"), parsedResult.minDecimal)
        assertEquals(BigDecimal("200.5"), parsedResult.maxDecimal)
    }

    @Test
    fun `Delete - deletes attribute`() {
        val attribute =
            attributeAPI.create(
                AttributeMocks.getAttributeCreateParams(componentId = component.id),
            )

        mockMvc
            .perform(
                delete("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes/${attribute.id.value}")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockUser(userId = user.id, email = user.email)),
            ).andExpect(status().isNoContent)
            .andReturn()

        // Verify attribute is deleted
        mockMvc
            .perform(
                get("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes/${attribute.id.value}")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isNotFound)
    }
}

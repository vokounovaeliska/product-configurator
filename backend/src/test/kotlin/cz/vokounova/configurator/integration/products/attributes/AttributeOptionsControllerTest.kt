package cz.vokounova.configurator.integration.products.attributes

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
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request.AttributeOptionCreateRequestDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request.AttributeOptionPatchRequestDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request.AttributeOptionPatchRequestDtoOp
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request.AttributeOptionPatchRequestDtoPath
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.response.AttributeOptionDto
import cz.vokounova.configurator.products.attributes.ports.inbound.AttributeAPI
import cz.vokounova.configurator.products.attributes.ports.inbound.AttributeOptionAPI
import cz.vokounova.configurator.products.components.ports.inbound.ComponentAPI
import cz.vokounova.configurator.products.models.ports.inbound.ProductModelAPI
import cz.vokounova.configurator.users.api.dto.UserIdDto
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.ports.outbound.UserRepository
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
import java.util.UUID

class AttributeOptionsControllerTest : BaseIntegrationTest() {
    companion object {
        private const val ATTRIBUTE_OPTIONS_URL = "/products/api/v1/product-models"
    }

    @Autowired
    protected lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var attributeOptionAPI: AttributeOptionAPI

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

    private lateinit var user: cz.vokounova.configurator.users.domain.User
    private lateinit var productModel: cz.vokounova.configurator.products.models.domain.ProductModel
    private lateinit var component: cz.vokounova.configurator.products.components.domain.Component
    private lateinit var attribute: cz.vokounova.configurator.products.attributes.domain.Attribute

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

        // Create product model, component, and ENUM attribute for all tests
        val productModelCreateParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        productModel = productModelAPI.create(productModelCreateParams)

        val componentCreateParams = ComponentMocks.getComponentCreateParams(productModelId = productModel.id)
        component = componentAPI.create(componentCreateParams)

        val attributeCreateParams =
            AttributeMocks.getAttributeCreateParams(
                componentId = component.id,
                type = AttributeType.ENUM,
                minInt = null,
                maxInt = null,
                minDecimal = null,
                maxDecimal = null,
            )
        attribute = attributeAPI.create(attributeCreateParams)
    }

    @Test
    fun `Get - Returns single attribute option`() {
        val optionCreateParams = AttributeMocks.getAttributeOptionCreateParams(attributeId = attribute.id)
        val created = attributeOptionAPI.create(optionCreateParams)

        val result =
            mockMvc
                .perform(
                    get(
                        "$ATTRIBUTE_OPTIONS_URL/${productModel.id.value}/components/${component.id.value}/" +
                            "attributes/${attribute.id.value}/options/${created.id.value}",
                    ).contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<AttributeOptionDto>(result)

        assertNotNull(parsedResult)
        assertEquals(created.id.value, parsedResult.id)
        assertEquals(created.attributeId.value, parsedResult.attributeId)
        assertEquals(created.value, parsedResult.value)
        assertEquals(created.label, parsedResult.label)
        assertEquals(created.imageUrl, parsedResult.imageUrl)
        assertEquals(created.sortOrder, parsedResult.sortOrder)
        assertNotNull(parsedResult.createdAt)
        assertNotNull(parsedResult.modifiedAt)
    }

    @Test
    fun `Create - creates attribute option with all fields`() {
        val params =
            AttributeOptionCreateRequestDto(
                value = "LARGE",
                label = "Large",
                imageUrl = "https://example.com/image.png",
                sortOrder = 3,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post(
                        "$ATTRIBUTE_OPTIONS_URL/${productModel.id.value}/components/" +
                            "${component.id.value}/attributes/${attribute.id.value}/options",
                    ).contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isCreated)
                .andReturn()

        val parsedResult = readResponse<AttributeOptionDto>(result)

        assertNotNull(parsedResult)
        assertNotNull(parsedResult.id)
        assertEquals(params.value, parsedResult.value)
        assertEquals(params.label, parsedResult.label)
        assertEquals(params.imageUrl, parsedResult.imageUrl)
        assertEquals(params.sortOrder, parsedResult.sortOrder)
        assertEquals(attribute.id.value, parsedResult.attributeId)
        assertNotNull(parsedResult.createdAt)
        assertNotNull(parsedResult.modifiedAt)
    }

    @Test
    fun `Create - creates attribute option without optional fields`() {
        val params =
            AttributeOptionCreateRequestDto(
                value = "MEDIUM",
                label = "Medium",
                imageUrl = null,
                sortOrder = null,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post(
                        "$ATTRIBUTE_OPTIONS_URL/${productModel.id.value}/components/${component.id.value}/" +
                            "attributes/${attribute.id.value}/options",
                    ).contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isCreated)
                .andReturn()

        val parsedResult = readResponse<AttributeOptionDto>(result)

        assertNotNull(parsedResult)
        assertEquals(params.value, parsedResult.value)
        assertEquals(params.label, parsedResult.label)
        assertNull(parsedResult.imageUrl)
        assertEquals(0, parsedResult.sortOrder) // default value
    }

    @Test
    fun `List - returns all attribute options for attribute`() {
        val option1 =
            attributeOptionAPI.create(
                AttributeMocks.getAttributeOptionCreateParams(
                    attributeId = attribute.id,
                    value = "SMALL",
                    label = "Small",
                    sortOrder = 1,
                ),
            )
        val option2 =
            attributeOptionAPI.create(
                AttributeMocks.getAttributeOptionCreateParams(
                    attributeId = attribute.id,
                    value = "MEDIUM",
                    label = "Medium",
                    sortOrder = 2,
                ),
            )
        val option3 =
            attributeOptionAPI.create(
                AttributeMocks.getAttributeOptionCreateParams(
                    attributeId = attribute.id,
                    value = "LARGE",
                    label = "Large",
                    sortOrder = 3,
                ),
            )

        val result =
            mockMvc
                .perform(
                    get(
                        "$ATTRIBUTE_OPTIONS_URL/${productModel.id.value}/components/${component.id.value}/" +
                            "attributes/${attribute.id.value}/options",
                    ).contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponseAsList<AttributeOptionDto>(result)

        assertNotNull(parsedResult)
        assertEquals(3, parsedResult.size)
        assertTrue(parsedResult.any { it.id == option1.id.value })
        assertTrue(parsedResult.any { it.id == option2.id.value })
        assertTrue(parsedResult.any { it.id == option3.id.value })
    }

    @Test
    fun `List - returns empty list when no options exist`() {
        val result =
            mockMvc
                .perform(
                    get(
                        "$ATTRIBUTE_OPTIONS_URL/${productModel.id.value}/components/${component.id.value}/" +
                            "attributes/${attribute.id.value}/options",
                    ).contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponseAsList<AttributeOptionDto>(result)

        assertNotNull(parsedResult)
        assertEquals(0, parsedResult.size)
    }

    @Test
    fun `Patch - updates attribute option label`() {
        val option =
            attributeOptionAPI.create(
                AttributeMocks.getAttributeOptionCreateParams(attributeId = attribute.id),
            )

        val patchParams =
            listOf(
                AttributeOptionPatchRequestDto(
                    path = AttributeOptionPatchRequestDtoPath.SlashLabel,
                    value = "Updated Label",
                    op = AttributeOptionPatchRequestDtoOp.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(patchParams)

        val result =
            mockMvc
                .perform(
                    patch(
                        "$ATTRIBUTE_OPTIONS_URL/${productModel.id.value}/components/${component.id.value}/" +
                            "attributes/${attribute.id.value}/options/${option.id.value}",
                    ).contentType("application/json-patch+json")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<AttributeOptionDto>(result)

        assertEquals("Updated Label", parsedResult.label)
        assertEquals(option.value, parsedResult.value) // unchanged
    }

    @Test
    fun `Patch - updates attribute option value`() {
        val option =
            attributeOptionAPI.create(
                AttributeMocks.getAttributeOptionCreateParams(attributeId = attribute.id),
            )

        val patchParams =
            listOf(
                AttributeOptionPatchRequestDto(
                    path = AttributeOptionPatchRequestDtoPath.SlashValue,
                    value = "NEW_VALUE",
                    op = AttributeOptionPatchRequestDtoOp.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(patchParams)

        val result =
            mockMvc
                .perform(
                    patch(
                        "$ATTRIBUTE_OPTIONS_URL/${productModel.id.value}/components/${component.id.value}/" +
                            "attributes/${attribute.id.value}/options/${option.id.value}",
                    ).contentType("application/json-patch+json")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<AttributeOptionDto>(result)

        assertEquals("NEW_VALUE", parsedResult.value)
    }

    @Test
    fun `Patch - updates attribute option imageUrl`() {
        val option =
            attributeOptionAPI.create(
                AttributeMocks.getAttributeOptionCreateParams(
                    attributeId = attribute.id,
                    imageUrl = "https://old-image.com/image.png",
                ),
            )

        val patchParams =
            listOf(
                AttributeOptionPatchRequestDto(
                    path = AttributeOptionPatchRequestDtoPath.SlashImageUrl,
                    value = "https://new-image.com/image.png",
                    op = AttributeOptionPatchRequestDtoOp.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(patchParams)

        val result =
            mockMvc
                .perform(
                    patch(
                        "$ATTRIBUTE_OPTIONS_URL/${productModel.id.value}/components/${component.id.value}/" +
                            "attributes/${attribute.id.value}/options/${option.id.value}",
                    ).contentType("application/json-patch+json")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<AttributeOptionDto>(result)

        assertEquals("https://new-image.com/image.png", parsedResult.imageUrl)
    }

    @Test
    fun `Patch - updates attribute option imageUrl to null`() {
        val option =
            attributeOptionAPI.create(
                AttributeMocks.getAttributeOptionCreateParams(
                    attributeId = attribute.id,
                    imageUrl = "https://example.com/image.png",
                ),
            )

        val patchParams =
            listOf(
                AttributeOptionPatchRequestDto(
                    path = AttributeOptionPatchRequestDtoPath.SlashImageUrl,
                    value = null,
                    op = AttributeOptionPatchRequestDtoOp.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(patchParams)

        val result =
            mockMvc
                .perform(
                    patch(
                        "$ATTRIBUTE_OPTIONS_URL/${productModel.id.value}/components/${component.id.value}/" +
                            "attributes/${attribute.id.value}/options/${option.id.value}",
                    ).contentType("application/json-patch+json")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<AttributeOptionDto>(result)

        assertNull(parsedResult.imageUrl)
    }

    @Test
    fun `Patch - updates attribute option sortOrder`() {
        val option =
            attributeOptionAPI.create(
                AttributeMocks.getAttributeOptionCreateParams(
                    attributeId = attribute.id,
                    sortOrder = 1,
                ),
            )

        val patchParams =
            listOf(
                AttributeOptionPatchRequestDto(
                    path = AttributeOptionPatchRequestDtoPath.SlashSortOrder,
                    value = 10,
                    op = AttributeOptionPatchRequestDtoOp.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(patchParams)

        val result =
            mockMvc
                .perform(
                    patch(
                        "$ATTRIBUTE_OPTIONS_URL/${productModel.id.value}/components/${component.id.value}/" +
                            "attributes/${attribute.id.value}/options/${option.id.value}",
                    ).contentType("application/json-patch+json")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<AttributeOptionDto>(result)

        assertEquals(10, parsedResult.sortOrder)
    }

    @Test
    fun `Patch - updates multiple fields at once`() {
        val option =
            attributeOptionAPI.create(
                AttributeMocks.getAttributeOptionCreateParams(
                    attributeId = attribute.id,
                    value = "OLD_VALUE",
                    label = "Old Label",
                    imageUrl = "https://old.com/image.png",
                    sortOrder = 1,
                ),
            )

        val patchParams =
            listOf(
                AttributeOptionPatchRequestDto(
                    path = AttributeOptionPatchRequestDtoPath.SlashValue,
                    value = "NEW_VALUE",
                    op = AttributeOptionPatchRequestDtoOp.Replace,
                ),
                AttributeOptionPatchRequestDto(
                    path = AttributeOptionPatchRequestDtoPath.SlashLabel,
                    value = "New Label",
                    op = AttributeOptionPatchRequestDtoOp.Replace,
                ),
                AttributeOptionPatchRequestDto(
                    path = AttributeOptionPatchRequestDtoPath.SlashImageUrl,
                    value = "https://new.com/image.png",
                    op = AttributeOptionPatchRequestDtoOp.Replace,
                ),
                AttributeOptionPatchRequestDto(
                    path = AttributeOptionPatchRequestDtoPath.SlashSortOrder,
                    value = 5,
                    op = AttributeOptionPatchRequestDtoOp.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(patchParams)

        val result =
            mockMvc
                .perform(
                    patch(
                        "$ATTRIBUTE_OPTIONS_URL/${productModel.id.value}/components/${component.id.value}/" +
                            "attributes/${attribute.id.value}/options/${option.id.value}",
                    ).contentType("application/json-patch+json")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<AttributeOptionDto>(result)

        assertEquals("NEW_VALUE", parsedResult.value)
        assertEquals("New Label", parsedResult.label)
        assertEquals("https://new.com/image.png", parsedResult.imageUrl)
        assertEquals(5, parsedResult.sortOrder)
    }

    @Test
    fun `Delete - deletes attribute option`() {
        val option =
            attributeOptionAPI.create(
                AttributeMocks.getAttributeOptionCreateParams(attributeId = attribute.id),
            )

        mockMvc
            .perform(
                delete(
                    "$ATTRIBUTE_OPTIONS_URL/${productModel.id.value}/components/${component.id.value}/" +
                        "attributes/${attribute.id.value}/options/${option.id.value}",
                ).contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockUser(userId = user.id, email = user.email)),
            ).andExpect(status().isNoContent)
            .andReturn()

        // Verify option is deleted
        mockMvc
            .perform(
                get(
                    "$ATTRIBUTE_OPTIONS_URL/${productModel.id.value}/components/${component.id.value}/" +
                        "attributes/${attribute.id.value}/options/${option.id.value}",
                ).contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isNotFound)
    }
}

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
import cz.vokounova.configurator.products.attributes.domain.AttributeId
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request.AttributeCreateRequestDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request.AttributePatchRequestDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request.AttributePatchRequestDtoOp
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request.AttributePatchRequestDtoPath
import cz.vokounova.configurator.products.attributes.ports.inbound.AttributeAPI
import cz.vokounova.configurator.products.components.domain.ComponentId
import cz.vokounova.configurator.products.components.ports.inbound.ComponentAPI
import cz.vokounova.configurator.products.models.domain.ProductModelId
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
import java.math.BigDecimal
import java.util.UUID

class AttributesControllerErrorsTest : BaseIntegrationTest() {
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

    private lateinit var user: cz.vokounova.configurator.users.domain.User
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
    fun `Get - Unauthorized - when authentication is missing`() {
        val attribute = attributeAPI.create(
            AttributeMocks.getAttributeCreateParams(componentId = component.id),
        )

        mockMvc
            .perform(
                get("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes/${attribute.id.value}")
                    .contentType(MediaType.APPLICATION_JSON),
            ).andExpect(status().isUnauthorized)
    }

    @Test
    fun `Get - NotFound - when attribute does not exist`() {
        val nonExistentId = UUID.randomUUID()

        mockMvc
            .perform(
                get("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes/$nonExistentId")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isNotFound)
    }

    @Test
    fun `Get - NotFound - when attribute belongs to different component`() {
        // Create a second component in the same product model
        val component2 = componentAPI.create(
            ComponentMocks.getComponentCreateParams(
                productModelId = productModel.id,
                code = "BOTTOM",
                label = "Table Bottom",
            ),
        )

        // Create an attribute for component2
        val attribute = attributeAPI.create(
            AttributeMocks.getAttributeCreateParams(componentId = component2.id),
        )

        // Try to access the attribute using component1's ID
        mockMvc
            .perform(
                get("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes/${attribute.id.value}")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isNotFound)
    }

    @Test
    fun `Get - NotFound - when component belongs to different product model`() {
        // Create a second product model
        val productModel2 = productModelAPI.create(
            ProductModelMocks.getProductModelCreateParams(userId = userId0Dto),
        )

        // Create a component for productModel2
        val component2 = componentAPI.create(
            ComponentMocks.getComponentCreateParams(
                productModelId = productModel2.id,
                code = "SIDE",
                label = "Table Side",
            ),
        )

        // Create an attribute for component2
        val attribute = attributeAPI.create(
            AttributeMocks.getAttributeCreateParams(componentId = component2.id),
        )

        // Try to access the attribute using productModel1's ID but component2's ID
        mockMvc
            .perform(
                get("$ATTRIBUTES_URL/${productModel.id.value}/components/${component2.id.value}/attributes/${attribute.id.value}")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isNotFound)
    }

    @Test
    fun `Create - BadRequest - when code is null`() {
        val params =
            AttributeCreateRequestDto(
                code = "",
                label = "Test Attribute",
                type = AttributeType.INTEGER,
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
                ).andExpect(status().isBadRequest)
                .andReturn()

        val errors = readResponse<ValidationErrorResponse>(result)
        assertNotNull(errors.errors)
        assertTrue(errors.errors.any { it.code == BaseValidationCode.FIELD_IS_EMPTY.name })
    }

    @Test
    fun `Create - BadRequest - when label is null`() {
        val params =
            AttributeCreateRequestDto(
                code = "TEST",
                label = "",
                type = AttributeType.INTEGER,
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
                ).andExpect(status().isBadRequest)
                .andReturn()

        val errors = readResponse<ValidationErrorResponse>(result)
        assertNotNull(errors.errors)
        assertTrue(errors.errors.any { it.code == BaseValidationCode.FIELD_IS_EMPTY.name })
    }

    @Test
    fun `Create - BadRequest - when minInt is greater than maxInt`() {
        val params =
            AttributeCreateRequestDto(
                code = "TEST",
                label = "Test Attribute",
                type = AttributeType.INTEGER,
                isRequired = true,
                minInt = 2000,
                maxInt = 800,
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
                ).andExpect(status().isBadRequest)
                .andReturn()

        val errors = readResponse<ValidationErrorResponse>(result)
        assertNotNull(errors.errors)
    }

    @Test
    fun `Create - BadRequest - when minDecimal is greater than maxDecimal`() {
        val params =
            AttributeCreateRequestDto(
                code = "TEST",
                label = "Test Attribute",
                type = AttributeType.DECIMAL,
                isRequired = true,
                minDecimal = BigDecimal("100.0"),
                maxDecimal = BigDecimal("50.0"),
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
                ).andExpect(status().isBadRequest)
                .andReturn()

        val errors = readResponse<ValidationErrorResponse>(result)
        assertNotNull(errors.errors)
    }

    @Test
    fun `Create - BadRequest - when INTEGER attribute has decimal fields`() {
        val params =
            AttributeCreateRequestDto(
                code = "TEST",
                label = "Test Attribute",
                type = AttributeType.INTEGER,
                isRequired = true,
                minInt = 100,
                maxInt = 200,
                minDecimal = BigDecimal("50.0"), // Should not be allowed for INTEGER
                maxDecimal = BigDecimal("300.0"), // Should not be allowed for INTEGER
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
                ).andExpect(status().isBadRequest)
                .andReturn()

        val errors = readResponse<ValidationErrorResponse>(result)
        assertNotNull(errors.errors)
    }

    @Test
    fun `Create - BadRequest - when DECIMAL attribute has integer fields`() {
        val params =
            AttributeCreateRequestDto(
                code = "TEST",
                label = "Test Attribute",
                type = AttributeType.DECIMAL,
                isRequired = true,
                minInt = 100, // Should not be allowed for DECIMAL
                maxInt = 200, // Should not be allowed for DECIMAL
                minDecimal = BigDecimal("50.0"),
                maxDecimal = BigDecimal("300.0"),
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
                ).andExpect(status().isBadRequest)
                .andReturn()

        val errors = readResponse<ValidationErrorResponse>(result)
        assertNotNull(errors.errors)
    }

    @Test
    fun `Patch - BadRequest - when label is null`() {
        val attribute = attributeAPI.create(
            AttributeMocks.getAttributeCreateParams(componentId = component.id),
        )

        val params =
            listOf(
                AttributePatchRequestDto(
                    path = AttributePatchRequestDtoPath.SlashLabel,
                    value = null,
                    op = AttributePatchRequestDtoOp.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    patch("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes/${attribute.id.value}")
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
    fun `Patch - BadRequest - when label is empty`() {
        val attribute = attributeAPI.create(
            AttributeMocks.getAttributeCreateParams(componentId = component.id),
        )

        val params =
            listOf(
                AttributePatchRequestDto(
                    path = AttributePatchRequestDtoPath.SlashLabel,
                    value = "",
                    op = AttributePatchRequestDtoOp.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    patch("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes/${attribute.id.value}")
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
    fun `Patch - BadRequest - when code is null`() {
        val attribute = attributeAPI.create(
            AttributeMocks.getAttributeCreateParams(componentId = component.id),
        )

        val params =
            listOf(
                AttributePatchRequestDto(
                    path = AttributePatchRequestDtoPath.SlashCode,
                    value = null,
                    op = AttributePatchRequestDtoOp.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    patch("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes/${attribute.id.value}")
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
    fun `Patch - BadRequest - when code is empty`() {
        val attribute = attributeAPI.create(
            AttributeMocks.getAttributeCreateParams(componentId = component.id),
        )

        val params =
            listOf(
                AttributePatchRequestDto(
                    path = AttributePatchRequestDtoPath.SlashCode,
                    value = "",
                    op = AttributePatchRequestDtoOp.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    patch("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes/${attribute.id.value}")
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
    fun `Patch - BadRequest - when minInt is greater than maxInt`() {
        val attribute = attributeAPI.create(
            AttributeMocks.getAttributeCreateParams(
                componentId = component.id,
                type = AttributeType.INTEGER,
                minInt = 100,
                maxInt = 200,
            ),
        )

        val params =
            listOf(
                AttributePatchRequestDto(
                    path = AttributePatchRequestDtoPath.SlashMinInt,
                    value = 300,
                    op = AttributePatchRequestDtoOp.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    patch("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes/${attribute.id.value}")
                        .contentType("application/json-patch+json")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val errors = readResponse<ValidationErrorResponse>(result)
        assertNotNull(errors.errors)
    }

    @Test
    fun `Patch - BadRequest - when minDecimal is greater than maxDecimal`() {
        val attribute = attributeAPI.create(
            AttributeMocks.getAttributeCreateParams(
                componentId = component.id,
                type = AttributeType.DECIMAL,
                minInt = null,
                maxInt = null,
                minDecimal = BigDecimal("10.0"),
                maxDecimal = BigDecimal("100.0"),
            ),
        )

        val params =
            listOf(
                AttributePatchRequestDto(
                    path = AttributePatchRequestDtoPath.SlashMinDecimal,
                    value = BigDecimal("200.0"),
                    op = AttributePatchRequestDtoOp.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    patch("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes/${attribute.id.value}")
                        .contentType("application/json-patch+json")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val errors = readResponse<ValidationErrorResponse>(result)
        assertNotNull(errors.errors)
    }

    @Test
    fun `Patch - NotFound - when attribute does not exist`() {
        val nonExistentId = UUID.randomUUID()

        val params =
            listOf(
                AttributePatchRequestDto(
                    path = AttributePatchRequestDtoPath.SlashLabel,
                    value = "New Label",
                    op = AttributePatchRequestDtoOp.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        mockMvc
            .perform(
                patch("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes/$nonExistentId")
                    .contentType("application/json-patch+json")
                    .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                    .content(payload),
            ).andExpect(status().isNotFound)
    }

    @Test
    fun `Delete - NotFound - when attribute does not exist`() {
        val nonExistentId = UUID.randomUUID()

        mockMvc
            .perform(
                delete("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes/$nonExistentId")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockUser(userId = user.id, email = user.email)),
            ).andExpect(status().isNotFound)
    }

    @Test
    fun `Delete - NotFound - when attribute belongs to different component`() {
        // Create a second component in the same product model
        val component2 = componentAPI.create(
            ComponentMocks.getComponentCreateParams(
                productModelId = productModel.id,
                code = "BOTTOM",
                label = "Table Bottom",
            ),
        )

        // Create an attribute for component2
        val attribute = attributeAPI.create(
            AttributeMocks.getAttributeCreateParams(componentId = component2.id),
        )

        // Try to delete the attribute using component1's ID
        mockMvc
            .perform(
                delete("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes/${attribute.id.value}")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockUser(userId = user.id, email = user.email)),
            ).andExpect(status().isNotFound)
    }

    @Test
    fun `Patch - NotFound - when attribute belongs to different component`() {
        // Create a second component in the same product model
        val component2 = componentAPI.create(
            ComponentMocks.getComponentCreateParams(
                productModelId = productModel.id,
                code = "BOTTOM",
                label = "Table Bottom",
            ),
        )

        // Create an attribute for component2
        val attribute = attributeAPI.create(
            AttributeMocks.getAttributeCreateParams(componentId = component2.id),
        )

        val params =
            listOf(
                AttributePatchRequestDto(
                    path = AttributePatchRequestDtoPath.SlashLabel,
                    value = "New Label",
                    op = AttributePatchRequestDtoOp.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        // Try to patch the attribute using component1's ID
        mockMvc
            .perform(
                patch("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes/${attribute.id.value}")
                    .contentType("application/json-patch+json")
                    .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                    .content(payload),
            ).andExpect(status().isNotFound)
    }

    @Test
    fun `List - BadRequest - when limit is less than 1`() {
        val result =
            mockMvc
                .perform(
                    get("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes")
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
        val result =
            mockMvc
                .perform(
                    get("$ATTRIBUTES_URL/${productModel.id.value}/components/${component.id.value}/attributes")
                        .param("orderBy", "invalidField")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val errors = readResponse<ValidationErrorResponse>(result)
        assertNotNull(errors.errors)
    }
}

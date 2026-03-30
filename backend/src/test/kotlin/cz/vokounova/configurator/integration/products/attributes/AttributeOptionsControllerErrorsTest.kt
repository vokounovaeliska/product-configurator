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
import cz.vokounova.configurator.products.attributes.ports.inbound.AttributeAPI
import cz.vokounova.configurator.products.attributes.ports.inbound.AttributeOptionAPI
import cz.vokounova.configurator.products.components.ports.inbound.ComponentAPI
import cz.vokounova.configurator.products.models.ports.inbound.ProductModelAPI
import cz.vokounova.configurator.shared.rest.response.ValidationErrorResponse
import cz.vokounova.configurator.shared.validations.BaseValidationCode
import cz.vokounova.configurator.users.api.dto.UserIdDto
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.ports.outbound.UserRepository
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
import java.util.UUID

class AttributeOptionsControllerErrorsTest : BaseIntegrationTest() {
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
    fun `Get - Unauthorized - when authentication is missing`() {
        val option =
            attributeOptionAPI.create(
                AttributeMocks.getAttributeOptionCreateParams(attributeId = attribute.id),
            )

        mockMvc
            .perform(
                get(
                    "$ATTRIBUTE_OPTIONS_URL/${productModel.id.value}/" +
                        "components/${component.id.value}/attributes/${attribute.id.value}/" +
                        "options/${option.id.value}",
                ).contentType(MediaType.APPLICATION_JSON),
            ).andExpect(status().isUnauthorized)
    }

    @Test
    fun `Get - NotFound - when attribute option does not exist`() {
        val nonExistentId = UUID.randomUUID()

        mockMvc
            .perform(
                get(
                    "$ATTRIBUTE_OPTIONS_URL/${productModel.id.value}/" +
                        "components/${component.id.value}/attributes/${attribute.id.value}/" +
                        "options/$nonExistentId",
                ).contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isNotFound)
    }

    @Test
    fun `Create - BadRequest - when value is null`() {
        val params =
            AttributeOptionCreateRequestDto(
                value = "",
                label = "Test Option",
                imageUrl = null,
                sortOrder = 1,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post(
                        "$ATTRIBUTE_OPTIONS_URL/${productModel.id.value}/" +
                            "components/${component.id.value}/attributes/${attribute.id.value}/options",
                    ).contentType(MediaType.APPLICATION_JSON)
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
            AttributeOptionCreateRequestDto(
                value = "TEST_VALUE",
                label = "",
                imageUrl = null,
                sortOrder = 1,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post(
                        "$ATTRIBUTE_OPTIONS_URL/${productModel.id.value}/" +
                            "components/${component.id.value}/attributes/${attribute.id.value}/options",
                    ).contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val errors = readResponse<ValidationErrorResponse>(result)
        assertNotNull(errors.errors)
        assertTrue(errors.errors.any { it.code == BaseValidationCode.FIELD_IS_EMPTY.name })
    }

    @Test
    fun `Patch - BadRequest - when value is null`() {
        val option =
            attributeOptionAPI.create(
                AttributeMocks.getAttributeOptionCreateParams(attributeId = attribute.id),
            )

        val params =
            listOf(
                AttributeOptionPatchRequestDto(
                    path = AttributeOptionPatchRequestDtoPath.SlashValue,
                    value = null,
                    op = AttributeOptionPatchRequestDtoOp.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    patch(
                        "$ATTRIBUTE_OPTIONS_URL/${productModel.id.value}/" +
                            "components/${component.id.value}/attributes/${attribute.id.value}/" +
                            "options/${option.id.value}",
                    ).contentType("application/json-patch+json")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val errors = readResponse<ValidationErrorResponse>(result)
        assertNotNull(errors.errors)
        assertTrue(errors.errors.any { it.code == BaseValidationCode.FIELD_IS_NULL.name })
    }

    @Test
    fun `Patch - BadRequest - when value is empty`() {
        val option =
            attributeOptionAPI.create(
                AttributeMocks.getAttributeOptionCreateParams(attributeId = attribute.id),
            )

        val params =
            listOf(
                AttributeOptionPatchRequestDto(
                    path = AttributeOptionPatchRequestDtoPath.SlashValue,
                    value = "",
                    op = AttributeOptionPatchRequestDtoOp.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    patch(
                        "$ATTRIBUTE_OPTIONS_URL/${productModel.id.value}/" +
                            "components/${component.id.value}/attributes/${attribute.id.value}/" +
                            "options/${option.id.value}",
                    ).contentType("application/json-patch+json")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val errors = readResponse<ValidationErrorResponse>(result)
        assertNotNull(errors.errors)
        assertTrue(errors.errors.any { it.code == BaseValidationCode.FIELD_IS_EMPTY.name })
    }

    @Test
    fun `Patch - BadRequest - when label is null`() {
        val option =
            attributeOptionAPI.create(
                AttributeMocks.getAttributeOptionCreateParams(attributeId = attribute.id),
            )

        val params =
            listOf(
                AttributeOptionPatchRequestDto(
                    path = AttributeOptionPatchRequestDtoPath.SlashLabel,
                    value = null,
                    op = AttributeOptionPatchRequestDtoOp.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    patch(
                        "$ATTRIBUTE_OPTIONS_URL/${productModel.id.value}/" +
                            "components/${component.id.value}/attributes/${attribute.id.value}/" +
                            "options/${option.id.value}",
                    ).contentType("application/json-patch+json")
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
        val option =
            attributeOptionAPI.create(
                AttributeMocks.getAttributeOptionCreateParams(attributeId = attribute.id),
            )

        val params =
            listOf(
                AttributeOptionPatchRequestDto(
                    path = AttributeOptionPatchRequestDtoPath.SlashLabel,
                    value = "",
                    op = AttributeOptionPatchRequestDtoOp.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    patch(
                        "$ATTRIBUTE_OPTIONS_URL/${productModel.id.value}/" +
                            "components/${component.id.value}/attributes/${attribute.id.value}/" +
                            "options/${option.id.value}",
                    ).contentType("application/json-patch+json")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val errors = readResponse<ValidationErrorResponse>(result)
        assertNotNull(errors.errors)
        assertTrue(errors.errors.any { it.code == BaseValidationCode.FIELD_IS_EMPTY.name })
    }

    @Test
    fun `Patch - NotFound - when attribute option does not exist`() {
        val nonExistentId = UUID.randomUUID()

        val params =
            listOf(
                AttributeOptionPatchRequestDto(
                    path = AttributeOptionPatchRequestDtoPath.SlashLabel,
                    value = "New Label",
                    op = AttributeOptionPatchRequestDtoOp.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        mockMvc
            .perform(
                patch(
                    "$ATTRIBUTE_OPTIONS_URL/${productModel.id.value}/" +
                        "components/${component.id.value}/attributes/${attribute.id.value}/" +
                        "options/$nonExistentId",
                ).contentType("application/json-patch+json")
                    .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                    .content(payload),
            ).andExpect(status().isNotFound)
    }

    @Test
    fun `Delete - NotFound - when attribute option does not exist`() {
        val nonExistentId = UUID.randomUUID()

        mockMvc
            .perform(
                delete(
                    "$ATTRIBUTE_OPTIONS_URL/${productModel.id.value}/" +
                        "components/${component.id.value}/attributes/${attribute.id.value}/" +
                        "options/$nonExistentId",
                ).contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockUser(userId = user.id, email = user.email)),
            ).andExpect(status().isNotFound)
    }

    @Test
    fun `List - Unauthorized - when authentication is missing`() {
        mockMvc
            .perform(
                get(
                    "$ATTRIBUTE_OPTIONS_URL/${productModel.id.value}/" +
                        "components/${component.id.value}/attributes/${attribute.id.value}/options",
                ).contentType(MediaType.APPLICATION_JSON),
            ).andExpect(status().isUnauthorized)
    }
}

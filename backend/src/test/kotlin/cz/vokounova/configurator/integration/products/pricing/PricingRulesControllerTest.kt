package cz.vokounova.configurator.integration.products.pricing

import cz.vokounova.configurator.configuration.BaseIntegrationTest
import cz.vokounova.configurator.generated.jooq.tables.references.ATTRIBUTE_PRICING_RULE
import cz.vokounova.configurator.generated.jooq.tables.references.PRODUCT_MODEL
import cz.vokounova.configurator.generated.jooq.tables.references.USER
import cz.vokounova.configurator.mocks.AuthMocks
import cz.vokounova.configurator.mocks.ComponentMocks
import cz.vokounova.configurator.mocks.ProductModelMocks
import cz.vokounova.configurator.mocks.UserMocks
import cz.vokounova.configurator.products.components.ports.inbound.ComponentAPI
import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.products.models.ports.inbound.ProductModelAPI
import cz.vokounova.configurator.products.pricing.infrastructure.rest.mapper.request.AttributePricingRuleCreateRequestDto
import cz.vokounova.configurator.products.pricing.infrastructure.rest.mapper.response.AttributePricingRuleDto
import cz.vokounova.configurator.products.pricing.ports.outbound.AttributePricingRuleRepository
import cz.vokounova.configurator.users.api.dto.UserIdDto
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.ports.outboud.UserRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.UUID

class PricingRulesControllerTest : BaseIntegrationTest() {
    companion object {
        private const val PRICING_RULES_URL = "/products/api/v1/product-models"
    }

    @Autowired
    protected lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var productModelAPI: ProductModelAPI

    @Autowired
    lateinit var componentAPI: ComponentAPI

    @Autowired
    lateinit var attributePricingRuleRepository: AttributePricingRuleRepository

    @Autowired
    lateinit var userRepository: UserRepository

    private val userId0: UserId = UserId(UUID.fromString("00000000-0000-0000-0000-000000000000"))
    private val userId0Dto: UserIdDto = UserIdDto.fromDomain(userId0)

    @BeforeEach
    override fun cleanUp() {
        dslContext.truncate(ATTRIBUTE_PRICING_RULE).cascade().execute()
        dslContext.truncate(PRODUCT_MODEL).cascade().execute()
        dslContext.truncate(USER).cascade().execute()
    }

    @Test
    fun `Get - Returns list of pricing rules`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val productModelCreateParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        val productModel = productModelAPI.create(productModelCreateParams)

        val componentCreateParams = ComponentMocks.getComponentCreateParams(productModelId = productModel.id)
        val component = componentAPI.create(componentCreateParams)

        val createParams =
            AttributePricingRuleCreateRequestDto(
                componentId = component.id.value,
                attributeCode = "COLOR",
                operator = "EQ",
                value = "red",
                toValue = null,
                price = 500,
            )
        val payload = objectMapper.writeValueAsString(createParams)

        mockMvc
            .perform(
                post("$PRICING_RULES_URL/${productModel.id.value}/pricing-rules")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                    .content(payload),
            ).andExpect(status().isCreated)

        val result =
            mockMvc
                .perform(
                    get("$PRICING_RULES_URL/${productModel.id.value}/pricing-rules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponseAsList<AttributePricingRuleDto>(result)

        assertNotNull(parsedResult)
        assertEquals(1, parsedResult.size)
        assertEquals("COLOR", parsedResult.first().attributeCode)
        assertEquals("EQ", parsedResult.first().operator)
        assertEquals("red", parsedResult.first().value)
        assertEquals(500, parsedResult.first().price)
    }

    @Test
    fun `Create - creates pricing rule`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val productModelCreateParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        val productModel = productModelAPI.create(productModelCreateParams)

        val componentCreateParams = ComponentMocks.getComponentCreateParams(productModelId = productModel.id)
        val component = componentAPI.create(componentCreateParams)

        val params =
            AttributePricingRuleCreateRequestDto(
                componentId = component.id.value,
                attributeCode = "SIZE",
                operator = "EQ",
                value = "large",
                toValue = null,
                price = 1000,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post("$PRICING_RULES_URL/${productModel.id.value}/pricing-rules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isCreated)
                .andReturn()

        val parsedResult = readResponse<AttributePricingRuleDto>(result)

        assertNotNull(parsedResult)
        assertNotNull(parsedResult.id)
        assertEquals(productModel.id.value, parsedResult.productModelId)
        assertEquals(component.id.value, parsedResult.componentId)
        assertEquals(params.attributeCode, parsedResult.attributeCode)
        assertEquals(params.operator, parsedResult.operator)
        assertEquals(params.value, parsedResult.value)
        assertEquals(params.price!!, parsedResult.price)
        assertNotNull(parsedResult.createdAt)
        assertNotNull(parsedResult.modifiedAt)
    }

    @Test
    fun `Create - uses default values when optional fields are null`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val productModelCreateParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        val productModel = productModelAPI.create(productModelCreateParams)

        val params =
            AttributePricingRuleCreateRequestDto(
                componentId = null,
                attributeCode = "WIDTH",
                operator = null,
                value = "100",
                toValue = null,
                price = null,
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    post("$PRICING_RULES_URL/${productModel.id.value}/pricing-rules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isCreated)
                .andReturn()

        val parsedResult = readResponse<AttributePricingRuleDto>(result)

        assertNotNull(parsedResult)
        assertEquals("EQ", parsedResult.operator)
        assertEquals(0, parsedResult.price)
    }

    @Test
    fun `Put - updates pricing rule`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val productModelCreateParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        val productModel = productModelAPI.create(productModelCreateParams)

        val componentCreateParams = ComponentMocks.getComponentCreateParams(productModelId = productModel.id)
        val component = componentAPI.create(componentCreateParams)

        val createParams =
            AttributePricingRuleCreateRequestDto(
                componentId = component.id.value,
                attributeCode = "COLOR",
                operator = "EQ",
                value = "blue",
                toValue = null,
                price = 200,
            )
        val createPayload = objectMapper.writeValueAsString(createParams)

        val createResult =
            mockMvc
                .perform(
                    post("$PRICING_RULES_URL/${productModel.id.value}/pricing-rules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(createPayload),
                ).andExpect(status().isCreated)
                .andReturn()

        val created = readResponse<AttributePricingRuleDto>(createResult)

        val updateParams =
            AttributePricingRuleCreateRequestDto(
                componentId = component.id.value,
                attributeCode = "COLOR",
                operator = "EQ",
                value = "blue",
                toValue = null,
                price = 350,
            )
        val updatePayload = objectMapper.writeValueAsString(updateParams)

        val result =
            mockMvc
                .perform(
                    put("$PRICING_RULES_URL/${productModel.id.value}/pricing-rules/${created.id}")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(updatePayload),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<AttributePricingRuleDto>(result)

        assertEquals(created.id, parsedResult.id)
        assertEquals(350, parsedResult.price)
    }

    @Test
    fun `Delete - deletes pricing rule`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val productModelCreateParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        val productModel = productModelAPI.create(productModelCreateParams)

        val componentCreateParams = ComponentMocks.getComponentCreateParams(productModelId = productModel.id)
        val component = componentAPI.create(componentCreateParams)

        val createParams =
            AttributePricingRuleCreateRequestDto(
                componentId = component.id.value,
                attributeCode = "COLOR",
                operator = "EQ",
                value = "green",
                toValue = null,
                price = 100,
            )
        val createPayload = objectMapper.writeValueAsString(createParams)

        val createResult =
            mockMvc
                .perform(
                    post("$PRICING_RULES_URL/${productModel.id.value}/pricing-rules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(createPayload),
                ).andExpect(status().isCreated)
                .andReturn()

        val created = readResponse<AttributePricingRuleDto>(createResult)

        assertEquals(1, attributePricingRuleRepository.findByProductModelId(ProductModelId(productModel.id.value)).size)

        mockMvc
            .perform(
                delete("$PRICING_RULES_URL/${productModel.id.value}/pricing-rules/${created.id}")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockUser(userId = user.id, email = user.email)),
            ).andExpect(status().isNoContent)

        assertEquals(0, attributePricingRuleRepository.findByProductModelId(ProductModelId(productModel.id.value)).size)
    }

    @Test
    fun `Get - Filters by componentId and attributeCode`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val productModelCreateParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        val productModel = productModelAPI.create(productModelCreateParams)

        val componentCreateParams = ComponentMocks.getComponentCreateParams(productModelId = productModel.id)
        val component = componentAPI.create(componentCreateParams)

        val createParams1 =
            AttributePricingRuleCreateRequestDto(
                componentId = component.id.value,
                attributeCode = "COLOR",
                operator = "EQ",
                value = "red",
                toValue = null,
                price = 100,
            )
        val createParams2 =
            AttributePricingRuleCreateRequestDto(
                componentId = component.id.value,
                attributeCode = "SIZE",
                operator = "EQ",
                value = "large",
                toValue = null,
                price = 200,
            )

        listOf(createParams1, createParams2).forEach { params ->
            val payload = objectMapper.writeValueAsString(params)
            mockMvc
                .perform(
                    post("$PRICING_RULES_URL/${productModel.id.value}/pricing-rules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isCreated)
        }

        val result =
            mockMvc
                .perform(
                    get("$PRICING_RULES_URL/${productModel.id.value}/pricing-rules")
                        .param("componentId", component.id.value.toString())
                        .param("attributeCode", "COLOR")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponseAsList<AttributePricingRuleDto>(result)

        assertEquals(1, parsedResult.size)
        assertEquals("COLOR", parsedResult.first().attributeCode)
    }
}

package cz.vokounova.configurator.integration.products.pricing

import cz.vokounova.configurator.configuration.BaseIntegrationTest
import cz.vokounova.configurator.generated.jooq.tables.references.ATTRIBUTE_PRICING_RULE
import cz.vokounova.configurator.generated.jooq.tables.references.PRODUCT_MODEL
import cz.vokounova.configurator.generated.jooq.tables.references.USER
import cz.vokounova.configurator.mocks.AuthMocks
import cz.vokounova.configurator.mocks.ProductModelMocks
import cz.vokounova.configurator.mocks.UserMocks
import cz.vokounova.configurator.products.components.ports.inbound.ComponentAPI
import cz.vokounova.configurator.products.models.ports.inbound.ProductModelAPI
import cz.vokounova.configurator.products.pricing.infrastructure.rest.mapper.request.AttributePricingRuleCreateRequestDto
import cz.vokounova.configurator.users.api.dto.UserIdDto
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.ports.outboud.UserRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.UUID

class PricingRulesControllerErrorsTest : BaseIntegrationTest() {
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
    fun `Get - Unauthorized - when authentication is missing`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val productModelCreateParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        val productModel = productModelAPI.create(productModelCreateParams)

        mockMvc
            .perform(
                get("$PRICING_RULES_URL/${productModel.id.value}/pricing-rules")
                    .contentType(MediaType.APPLICATION_JSON),
            ).andExpect(status().isUnauthorized)
    }

    @Test
    fun `Get - returns empty list for non-existent product model`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val nonExistentProductModelId = UUID.randomUUID()

        val result =
            mockMvc
                .perform(
                    get("$PRICING_RULES_URL/$nonExistentProductModelId/pricing-rules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponseAsList<Map<String, Any>>(result)
        assert(parsedResult.isEmpty())
    }

    @Test
    fun `Put - NotFound - when rule does not exist`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val productModelCreateParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        val productModel = productModelAPI.create(productModelCreateParams)

        val nonExistentRuleId = UUID.randomUUID()

        val updateParams =
            AttributePricingRuleCreateRequestDto(
                componentId = null,
                attributeCode = "COLOR",
                operator = "EQ",
                value = "red",
                toValue = null,
                price = 100,
            )
        val payload = objectMapper.writeValueAsString(updateParams)

        mockMvc
            .perform(
                put("$PRICING_RULES_URL/${productModel.id.value}/pricing-rules/$nonExistentRuleId")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                    .content(payload),
            ).andExpect(status().isNotFound)
    }

    @Test
    fun `Delete - NotFound - when rule does not exist`() {
        val user = UserMocks.getUser(id = userId0)
        userRepository.create(user)

        val productModelCreateParams = ProductModelMocks.getProductModelCreateParams(userId = userId0Dto)
        val productModel = productModelAPI.create(productModelCreateParams)

        val nonExistentRuleId = UUID.randomUUID()

        mockMvc
            .perform(
                delete("$PRICING_RULES_URL/${productModel.id.value}/pricing-rules/$nonExistentRuleId")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockUser(userId = user.id, email = user.email)),
            ).andExpect(status().isNotFound)
    }
}

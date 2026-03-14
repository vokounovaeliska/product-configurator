package cz.vokounova.configurator.integration.embed

import com.fasterxml.jackson.databind.node.ObjectNode
import cz.vokounova.configurator.configuration.BaseIntegrationTest
import cz.vokounova.configurator.customerrequest.api.dto.CustomerRequestResultDto
import cz.vokounova.configurator.generated.jooq.tables.references.CUSTOMER_REQUEST
import cz.vokounova.configurator.generated.jooq.tables.references.PRODUCT_MODEL
import cz.vokounova.configurator.generated.jooq.tables.references.USER
import cz.vokounova.configurator.mocks.ProductModelMocks
import cz.vokounova.configurator.mocks.UserMocks
import cz.vokounova.configurator.products.models.domain.ProductModelJsonPatchParams
import cz.vokounova.configurator.products.models.domain.ProductModelJsonPatchParamsPath
import cz.vokounova.configurator.products.models.ports.inbound.ProductModelAPI
import cz.vokounova.configurator.shared.rest.jsonpatch.JsonPatchOperation
import cz.vokounova.configurator.users.api.dto.UserIdDto
import cz.vokounova.configurator.users.ports.outboud.UserRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.UUID

class CustomerRequestEmbedControllerTest : BaseIntegrationTest() {
    companion object {
        private const val CUSTOMER_REQUESTS_URL = "/embed/api/v1/customer-requests"
    }

    @Autowired
    protected lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var productModelAPI: ProductModelAPI

    @Autowired
    lateinit var userRepository: UserRepository

    private val userId = UUID.fromString("a1b16dcb-b885-4783-b085-358a97e7e71e")

    @BeforeEach
    override fun cleanUp() {
        dslContext.truncate(CUSTOMER_REQUEST).cascade().execute()
        dslContext.truncate(PRODUCT_MODEL).cascade().execute()
        dslContext.truncate(USER).cascade().execute()
    }

    @Test
    fun `Create - creates customer request for published product`() {
        val user = UserMocks.getUser(id = cz.vokounova.configurator.users.domain.UserId(userId))
        userRepository.create(user)

        val createParams = ProductModelMocks.getProductModelCreateParams(userId = UserIdDto(userId))
        val created = productModelAPI.create(createParams)
        productModelAPI.patch(
            created.id,
            listOf(
                ProductModelJsonPatchParams(
                    path = ProductModelJsonPatchParamsPath.URL,
                    value = "test-table",
                    op = JsonPatchOperation.REPLACE,
                ),
                ProductModelJsonPatchParams(
                    path = ProductModelJsonPatchParamsPath.IS_PUBLISHED,
                    value = true,
                    op = JsonPatchOperation.REPLACE,
                ),
            ),
        )

        val configJson = objectMapper.createObjectNode() as ObjectNode
        configJson.put("test", "value")

        val body =
            mapOf(
                "customerName" to "Jan Novák",
                "customerEmail" to "jan@example.com",
                "customerPhone" to "+420123456789",
                "customerNote" to "I would like a quote",
                "productModelId" to created.id.value.toString(),
                "productModelName" to created.name,
                "productModelDescription" to created.description,
                "currency" to created.currency,
                "totalPrice" to 150000,
                "configurationJson" to configJson,
            )
        val payload = objectMapper.writeValueAsString(body)

        val result =
            mockMvc
                .perform(
                    post(CUSTOMER_REQUESTS_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload),
                )
                .andExpect(status().isCreated)
                .andReturn()

        val parsed = readResponse<CustomerRequestResultDto>(result)
        assertNotNull(parsed)
        assertNotNull(parsed.id)
        assertEquals("NEW", parsed.status)
    }

    @Test
    fun `Create - accepts snapshotImageBase64`() {
        val user = UserMocks.getUser(id = cz.vokounova.configurator.users.domain.UserId(userId))
        userRepository.create(user)

        val createParams = ProductModelMocks.getProductModelCreateParams(userId = UserIdDto(userId))
        val created = productModelAPI.create(createParams)
        productModelAPI.patch(
            created.id,
            listOf(
                ProductModelJsonPatchParams(
                    path = ProductModelJsonPatchParamsPath.URL,
                    value = "test-table",
                    op = JsonPatchOperation.REPLACE,
                ),
                ProductModelJsonPatchParams(
                    path = ProductModelJsonPatchParamsPath.IS_PUBLISHED,
                    value = true,
                    op = JsonPatchOperation.REPLACE,
                ),
            ),
        )

        val configJson = objectMapper.createObjectNode() as ObjectNode
        configJson.put("selectedOptionsByComponent", "{}")

        val base64Snapshot =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

        val body =
            mapOf(
                "customerName" to "Test User",
                "customerEmail" to "test@example.com",
                "customerPhone" to null,
                "customerNote" to null,
                "productModelId" to created.id.value.toString(),
                "productModelName" to created.name,
                "productModelDescription" to created.description,
                "currency" to created.currency,
                "totalPrice" to 100000,
                "configurationJson" to configJson,
                "pricingBreakdownJson" to null,
                "snapshotImageBase64" to base64Snapshot,
            )
        val payload = objectMapper.writeValueAsString(body)

        val result =
            mockMvc
                .perform(
                    post(CUSTOMER_REQUESTS_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload),
                )
                .andExpect(status().isCreated)
                .andReturn()

        val parsed = readResponse<CustomerRequestResultDto>(result)
        assertNotNull(parsed)
        assertNotNull(parsed.id)
    }
}

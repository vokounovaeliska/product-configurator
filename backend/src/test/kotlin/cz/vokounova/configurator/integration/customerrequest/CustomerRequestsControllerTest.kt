package cz.vokounova.configurator.integration.customerrequest

import com.fasterxml.jackson.databind.node.ObjectNode
import cz.vokounova.configurator.configuration.BaseIntegrationTest
import cz.vokounova.configurator.customerrequest.infrastructure.rest.mapper.CustomerRequestDto
import cz.vokounova.configurator.generated.jooq.tables.references.CUSTOMER_REQUEST
import cz.vokounova.configurator.generated.jooq.tables.references.PRODUCT_MODEL
import cz.vokounova.configurator.generated.jooq.tables.references.USER
import cz.vokounova.configurator.mocks.AuthMocks
import cz.vokounova.configurator.mocks.ProductModelMocks
import cz.vokounova.configurator.mocks.UserMocks
import cz.vokounova.configurator.products.models.domain.ProductModelJsonPatchParams
import cz.vokounova.configurator.products.models.domain.ProductModelJsonPatchParamsPath
import cz.vokounova.configurator.products.models.ports.inbound.ProductModelAPI
import cz.vokounova.configurator.shared.rest.jsonpatch.JsonPatchOperation
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
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.UUID

class CustomerRequestsControllerTest : BaseIntegrationTest() {
    companion object {
        private const val CUSTOMER_REQUESTS_URL = "/products/api/v1/customer-requests"
        private const val EMBED_CUSTOMER_REQUESTS_URL = "/embed/api/v1/customer-requests"
    }

    @Autowired
    protected lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var productModelAPI: ProductModelAPI

    @Autowired
    lateinit var userRepository: UserRepository

    private val userId = UserId(UUID.fromString("a1b16dcb-b885-4783-b085-358a97e7e71e"))
    private val userIdDto = UserIdDto(userId.value)

    @BeforeEach
    override fun cleanUp() {
        dslContext.truncate(CUSTOMER_REQUEST).cascade().execute()
        dslContext.truncate(PRODUCT_MODEL).cascade().execute()
        dslContext.truncate(USER).cascade().execute()
    }

    private fun createCustomerRequestViaEmbed(): UUID {
        val user = UserMocks.getUser(id = userId)
        userRepository.create(user)

        val createParams = ProductModelMocks.getProductModelCreateParams(userId = userIdDto)
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
                    post(EMBED_CUSTOMER_REQUESTS_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload),
                ).andExpect(status().isCreated)
                .andReturn()

        val parsed = readResponse<Map<String, Any>>(result)
        return UUID.fromString(parsed["id"] as String)
    }

    @Test
    fun `Get - Returns customer request by id`() {
        val requestId = createCustomerRequestViaEmbed()
        val user = UserMocks.getUser(id = userId)

        val result =
            mockMvc
                .perform(
                    get("$CUSTOMER_REQUESTS_URL/$requestId")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email)),
                ).andExpect(status().isOk)
                .andReturn()

        val parsed = readResponse<CustomerRequestDto>(result)
        assertNotNull(parsed)
        assertEquals(requestId, parsed.id)
        assertEquals("NEW", parsed.status)
        assertEquals("Jan Novák", parsed.customerName)
        assertEquals("jan@example.com", parsed.customerEmail)
    }

    @Test
    fun `List - Returns customer requests for product model owner`() {
        createCustomerRequestViaEmbed()
        val user = UserMocks.getUser(id = userId)

        val result =
            mockMvc
                .perform(
                    get(CUSTOMER_REQUESTS_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .param("limit", "20")
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email)),
                ).andExpect(status().isOk)
                .andReturn()

        val parsed = readResponseAsList<CustomerRequestDto>(result)
        assertNotNull(parsed)
        assertEquals(1, parsed.size)
        assertEquals("NEW", parsed.first().status)
    }

    @Test
    fun `Patch status - Updates customer request status`() {
        val requestId = createCustomerRequestViaEmbed()
        val user = UserMocks.getUser(id = userId)

        val body = mapOf("status" to "IN_PROGRESS")
        val payload = objectMapper.writeValueAsString(body)

        val result =
            mockMvc
                .perform(
                    patch("$CUSTOMER_REQUESTS_URL/$requestId/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                        .content(payload),
                ).andExpect(status().isOk)
                .andReturn()

        val parsed = readResponse<CustomerRequestDto>(result)
        assertNotNull(parsed)
        assertEquals(requestId, parsed.id)
        assertEquals("IN_PROGRESS", parsed.status)
    }

    @Test
    fun `Get - NotFound - when request does not belong to user`() {
        val requestId = createCustomerRequestViaEmbed()
        val otherUserId = UserId(UUID.fromString("b2c27edc-c996-5894-c196-469b08f8f82f"))
        val otherUser = UserMocks.getUser(id = otherUserId, email = "other@example.com")
        userRepository.create(otherUser)

        mockMvc
            .perform(
                get("$CUSTOMER_REQUESTS_URL/$requestId")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockUser(userId = otherUser.id, email = otherUser.email)),
            ).andExpect(status().isNotFound)
    }

    @Test
    fun `Get - Unauthorized - when authentication is missing`() {
        val requestId = createCustomerRequestViaEmbed()

        mockMvc
            .perform(
                get("$CUSTOMER_REQUESTS_URL/$requestId")
                    .contentType(MediaType.APPLICATION_JSON),
            ).andExpect(status().isUnauthorized)
    }
}

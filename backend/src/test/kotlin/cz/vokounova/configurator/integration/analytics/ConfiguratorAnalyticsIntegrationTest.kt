package cz.vokounova.configurator.integration.analytics

import cz.vokounova.configurator.analytics.api.dto.ConfiguratorAnalyticsClientEventDto
import cz.vokounova.configurator.analytics.api.dto.ConfiguratorAnalyticsEventBatchRequestDto
import cz.vokounova.configurator.analytics.domain.ConfiguratorAnalyticsEventType
import cz.vokounova.configurator.analytics.domain.ConfiguratorAnalyticsSurface
import cz.vokounova.configurator.analytics.infrastructure.rest.dto.ConfiguratorAnalyticsSummaryResponseDto
import cz.vokounova.configurator.configuration.BaseIntegrationTest
import cz.vokounova.configurator.generated.jooq.tables.references.CONFIGURATOR_ANALYTICS_EVENT
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
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.UUID

class ConfiguratorAnalyticsIntegrationTest : BaseIntegrationTest() {
    companion object {
        private const val EMBED_ANALYTICS_EVENTS = "/embed/api/v1/configurator-analytics/events"
        private const val SUMMARY_URL = "/products/api/v1/configurator-analytics/summary"
    }

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var productModelAPI: ProductModelAPI

    @Autowired
    private lateinit var userRepository: UserRepository

    private val userId = UserId(UUID.fromString("b2c27ecd-c996-4e94-9c06-469b98f8b81f"))

    @BeforeEach
    override fun cleanUp() {
        dslContext.truncate(CONFIGURATOR_ANALYTICS_EVENT).cascade().execute()
        dslContext.truncate(CUSTOMER_REQUEST).cascade().execute()
        dslContext.truncate(PRODUCT_MODEL).cascade().execute()
        dslContext.truncate(USER).cascade().execute()
    }

    @Test
    fun `Embed API - accepts public page events for published model`() {
        val (modelId, _) = createPublishedProduct(url = "analytics-desk")
        val batch =
            ConfiguratorAnalyticsEventBatchRequestDto(
                events =
                    listOf(
                        ConfiguratorAnalyticsClientEventDto(
                            type = ConfiguratorAnalyticsEventType.CONFIGURATOR_OPEN,
                            sessionId = "sess-pub-1",
                            productModelId = modelId,
                            surface = ConfiguratorAnalyticsSurface.PUBLIC_CONFIGURATOR_PAGE,
                        ),
                    ),
            )
        mockMvc
            .perform(
                post(EMBED_ANALYTICS_EVENTS)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(batch)),
            ).andExpect(status().isNoContent)
    }

    @Test
    fun `Embed API - accepts embed iframe when owner and url match`() {
        val (modelId, _) = createPublishedProduct(url = "embed-analytics-table")
        val batch =
            ConfiguratorAnalyticsEventBatchRequestDto(
                events =
                    listOf(
                        ConfiguratorAnalyticsClientEventDto(
                            type = ConfiguratorAnalyticsEventType.REQUEST_FORM_OPEN,
                            sessionId = "sess-embed-1",
                            productModelId = modelId,
                            surface = ConfiguratorAnalyticsSurface.EMBED_IFRAME,
                            embedOwnerUserId = userId.value,
                            embedProductUrl = "embed-analytics-table",
                        ),
                    ),
            )
        mockMvc
            .perform(
                post(EMBED_ANALYTICS_EVENTS)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(batch)),
            ).andExpect(status().isNoContent)
    }

    @Test
    fun `Embed API - rejects invalid event type`() {
        val (modelId, _) = createPublishedProduct(url = "reject-type")
        val batch =
            ConfiguratorAnalyticsEventBatchRequestDto(
                events =
                    listOf(
                        ConfiguratorAnalyticsClientEventDto(
                            type = ConfiguratorAnalyticsEventType.REQUEST_SUBMITTED,
                            sessionId = "sess-bad-type",
                            productModelId = modelId,
                            surface = ConfiguratorAnalyticsSurface.PUBLIC_CONFIGURATOR_PAGE,
                        ),
                    ),
            )
        mockMvc
            .perform(
                post(EMBED_ANALYTICS_EVENTS)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(batch)),
            ).andExpect(status().isBadRequest)
    }

    @Test
    fun `Embed API - deduplicates duplicate client rows same session type and utc day`() {
        val (modelId, _) = createPublishedProduct(url = "deduplicate-url")
        val open =
            ConfiguratorAnalyticsClientEventDto(
                type = ConfiguratorAnalyticsEventType.CONFIGURATOR_OPEN,
                sessionId = "sess-deduplicate",
                productModelId = modelId,
                surface = ConfiguratorAnalyticsSurface.PUBLIC_CONFIGURATOR_PAGE,
            )
        val batch =
            ConfiguratorAnalyticsEventBatchRequestDto(
                events = listOf(open, open),
            )
        mockMvc
            .perform(
                post(EMBED_ANALYTICS_EVENTS)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(batch)),
            ).andExpect(status().isNoContent)

        val user = userRepository.findById(userId, false)!!
        val result =
            mockMvc
                .perform(
                    get("$SUMMARY_URL?timePreset=ALL_TIME&productModelId=$modelId")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = userId, email = user.email)),
                ).andExpect(status().isOk)
                .andReturn()

        val summary = readResponse<ConfiguratorAnalyticsSummaryResponseDto>(result)
        assertNotNull(summary.headline)
        assertEquals(1L, summary.headline!!.configuratorOpens)
    }

    @Test
    fun `Summary - requires authentication`() {
        mockMvc
            .perform(
                get("$SUMMARY_URL?timePreset=ALL_TIME")
                    .contentType(MediaType.APPLICATION_JSON),
            ).andExpect(status().isUnauthorized)
    }

    @Test
    fun `Summary - rejects invalid time preset`() {
        val user = UserMocks.getUser(id = userId)
        userRepository.create(user)
        mockMvc
            .perform(
                get("$SUMMARY_URL?timePreset=NOT_A_PRESET")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockUser(userId = userId, email = user.email)),
            ).andExpect(status().isBadRequest)
    }

    @Test
    fun `Summary - returns per-model table and headline when filtered`() {
        val (modelId, modelName) = createPublishedProduct(url = "summary-model")
        val batch =
            ConfiguratorAnalyticsEventBatchRequestDto(
                events =
                    listOf(
                        ConfiguratorAnalyticsClientEventDto(
                            type = ConfiguratorAnalyticsEventType.CONFIGURATOR_OPEN,
                            sessionId = "s1",
                            productModelId = modelId,
                            surface = ConfiguratorAnalyticsSurface.PUBLIC_CONFIGURATOR_PAGE,
                        ),
                        ConfiguratorAnalyticsClientEventDto(
                            type = ConfiguratorAnalyticsEventType.CONFIGURATION_CHANGE,
                            sessionId = "s1",
                            productModelId = modelId,
                            surface = ConfiguratorAnalyticsSurface.PUBLIC_CONFIGURATOR_PAGE,
                        ),
                        ConfiguratorAnalyticsClientEventDto(
                            type = ConfiguratorAnalyticsEventType.REQUEST_FORM_OPEN,
                            sessionId = "s1",
                            productModelId = modelId,
                            surface = ConfiguratorAnalyticsSurface.PUBLIC_CONFIGURATOR_PAGE,
                        ),
                    ),
            )
        mockMvc
            .perform(
                post(EMBED_ANALYTICS_EVENTS)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(batch)),
            ).andExpect(status().isNoContent)

        val user = userRepository.findById(userId, false)!!
        val tableResult =
            mockMvc
                .perform(
                    get("$SUMMARY_URL?timePreset=ALL_TIME")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = userId, email = user.email)),
                ).andExpect(status().isOk)
                .andReturn()

        val tableSummary = readResponse<ConfiguratorAnalyticsSummaryResponseDto>(tableResult)
        assertEquals(null, tableSummary.headline)
        assertEquals(1, tableSummary.byProductModel.size)
        val row = tableSummary.byProductModel.single()
        assertEquals(modelId, row.productModelId)
        assertEquals(modelName, row.productModelName)
        assertEquals(1L, row.configuratorOpens)
        assertEquals(1L, row.changedAtLeastOnce)
        assertEquals(1L, row.requestFormOpens)
        assertEquals(0L, row.submissions)

        val headlineResult =
            mockMvc
                .perform(
                    get("$SUMMARY_URL?timePreset=ALL_TIME&productModelId=$modelId")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = userId, email = user.email)),
                ).andExpect(status().isOk)
                .andReturn()

        val headlineSummary = readResponse<ConfiguratorAnalyticsSummaryResponseDto>(headlineResult)
        assertTrue(headlineSummary.byProductModel.isEmpty())
        assertNotNull(headlineSummary.headline)
        assertEquals(1L, headlineSummary.headline!!.configuratorOpens)
        assertEquals(1L, headlineSummary.headline.changedAtLeastOnce)
        assertEquals(1L, headlineSummary.headline.requestFormOpens)
        assertEquals(0L, headlineSummary.headline.submissions)
    }

    private fun createPublishedProduct(url: String): Pair<UUID, String> {
        val user = UserMocks.getUser(id = userId)
        userRepository.create(user)

        val created = productModelAPI.create(ProductModelMocks.getProductModelCreateParams(userId = UserIdDto.fromDomain(userId)))
        productModelAPI.patch(
            created.id,
            listOf(
                ProductModelJsonPatchParams(
                    path = ProductModelJsonPatchParamsPath.URL,
                    value = url,
                    op = JsonPatchOperation.REPLACE,
                ),
                ProductModelJsonPatchParams(
                    path = ProductModelJsonPatchParamsPath.IS_PUBLISHED,
                    value = true,
                    op = JsonPatchOperation.REPLACE,
                ),
            ),
        )
        return created.id.value to created.name
    }
}

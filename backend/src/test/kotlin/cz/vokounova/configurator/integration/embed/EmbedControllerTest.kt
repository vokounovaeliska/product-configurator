package cz.vokounova.configurator.integration.embed

import cz.vokounova.configurator.configuration.BaseIntegrationTest
import cz.vokounova.configurator.embed.infrastructure.rest.ProductModelEmbedDto
import cz.vokounova.configurator.generated.jooq.tables.references.CUSTOMER_REQUEST
import cz.vokounova.configurator.generated.jooq.tables.references.PRODUCT_MODEL
import cz.vokounova.configurator.generated.jooq.tables.references.USER
import cz.vokounova.configurator.mocks.ProductModelMocks
import cz.vokounova.configurator.mocks.UserMocks
import cz.vokounova.configurator.products.models.ports.inbound.ProductModelAPI
import cz.vokounova.configurator.users.api.dto.UserIdDto
import cz.vokounova.configurator.users.ports.outboud.UserRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.UUID

class EmbedControllerTest : BaseIntegrationTest() {
    companion object {
        private const val EMBED_URL = "/embed/api/v1/products/by-url"
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
    fun `Get by url - returns 404 when product not found`() {
        mockMvc
            .perform(get("$EMBED_URL/non-existent-url").contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound)
    }

    @Test
    fun `Get by url - returns 404 when product not published`() {
        val user = UserMocks.getUser(id = cz.vokounova.configurator.users.domain.UserId(userId))
        userRepository.create(user)

        val createParams = ProductModelMocks.getProductModelCreateParams(userId = UserIdDto(userId))
        val created = productModelAPI.create(createParams)
        productModelAPI.patch(
            created.id,
            listOf(
                cz.vokounova.configurator.products.models.domain.ProductModelJsonPatchParams(
                    path = cz.vokounova.configurator.products.models.domain.ProductModelJsonPatchParamsPath.URL,
                    value = "test-table",
                    op = cz.vokounova.configurator.shared.rest.jsonpatch.JsonPatchOperation.REPLACE,
                ),
            ),
        )

        mockMvc
            .perform(get("$EMBED_URL/test-table").contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound)
    }

    @Test
    fun `Get by url - returns product when published`() {
        val user = UserMocks.getUser(id = cz.vokounova.configurator.users.domain.UserId(userId))
        userRepository.create(user)

        val createParams = ProductModelMocks.getProductModelCreateParams(userId = UserIdDto(userId))
        val created = productModelAPI.create(createParams)
        productModelAPI.patch(
            created.id,
            listOf(
                cz.vokounova.configurator.products.models.domain.ProductModelJsonPatchParams(
                    path = cz.vokounova.configurator.products.models.domain.ProductModelJsonPatchParamsPath.URL,
                    value = "test-table",
                    op = cz.vokounova.configurator.shared.rest.jsonpatch.JsonPatchOperation.REPLACE,
                ),
                cz.vokounova.configurator.products.models.domain.ProductModelJsonPatchParams(
                    path = cz.vokounova.configurator.products.models.domain.ProductModelJsonPatchParamsPath.IS_PUBLISHED,
                    value = true,
                    op = cz.vokounova.configurator.shared.rest.jsonpatch.JsonPatchOperation.REPLACE,
                ),
            ),
        )

        val result =
            mockMvc
                .perform(get("$EMBED_URL/test-table").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk)
                .andReturn()

        val parsed = readResponse<ProductModelEmbedDto>(result)
        assertNotNull(parsed)
        assertEquals(created.id.value, parsed.id)
        assertEquals(created.name, parsed.name)
        assertEquals("test-table", parsed.url)
    }
}

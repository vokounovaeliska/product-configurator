package cz.vokounova.configurator.integration.products

import cz.vokounova.configurator.configuration.BaseIntegrationTest
import cz.vokounova.configurator.generated.jooq.tables.references.COMPONENT_DEFINITION
import cz.vokounova.configurator.generated.jooq.tables.references.PRODUCT_MODEL
import cz.vokounova.configurator.mocks.AuthMocks
import cz.vokounova.configurator.products.domain.Component
import cz.vokounova.configurator.products.domain.ComponentId
import cz.vokounova.configurator.products.domain.ProductModelId
import cz.vokounova.configurator.products.infrastructure.rest.mapper.request.ComponentCreateRequestDto
import cz.vokounova.configurator.products.infrastructure.rest.mapper.request.ComponentPatchRequestDto
import cz.vokounova.configurator.products.infrastructure.rest.mapper.request.ComponentPatchRequestDtoOp
import cz.vokounova.configurator.products.infrastructure.rest.mapper.request.ComponentPatchRequestDtoPath
import cz.vokounova.configurator.products.infrastructure.rest.mapper.response.ComponentDto
import cz.vokounova.configurator.products.infrastructure.rest.mapper.response.ComponentPaginatedResponseDto
import cz.vokounova.configurator.products.ports.outbound.ComponentRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
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
import java.time.OffsetDateTime
import java.util.UUID

class ComponentsControllerTest : BaseIntegrationTest() {
    @Autowired
    protected lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var componentRepository: ComponentRepository

    private val productModelId = ProductModelId(UUID.fromString("11111111-1111-1111-1111-111111111111"))
    private val componentId1 = ComponentId(UUID.fromString("22222222-2222-2222-2222-222222222222"))
    private val componentId2 = ComponentId(UUID.fromString("33333333-3333-3333-3333-333333333333"))

    @BeforeEach
    override fun cleanUp() {
        dslContext.truncate(COMPONENT_DEFINITION).cascade().execute()
        dslContext.truncate(PRODUCT_MODEL).cascade().execute()
        
        // Create a product model for components to belong to
        dslContext.insertInto(PRODUCT_MODEL)
            .set(PRODUCT_MODEL.ID, productModelId.value)
            .set(PRODUCT_MODEL.USER_ID, UUID.randomUUID())
            .set(PRODUCT_MODEL.NAME, "Test Product Model")
            .set(PRODUCT_MODEL.DESCRIPTION, "Test Description")
            .set(PRODUCT_MODEL.BASE_PRICE_CENTS, 10000)
            .set(PRODUCT_MODEL.CURRENCY, "CZK")
            .set(PRODUCT_MODEL.IS_ACTIVE, true)
            .set(PRODUCT_MODEL.CREATED_AT, OffsetDateTime.now())
            .set(PRODUCT_MODEL.MODIFIED_AT, OffsetDateTime.now())
            .execute()
    }

    @Test
    fun `Create - creates component`() {
        val params =
            ComponentCreateRequestDto(
                code = "TOP",
                label = "Table Top",
                description = "The top surface of the table",
                sortOrder = 1,
            )

        val payload = objectMapper.writeValueAsString(params)
        val url = "/products/api/v1/product-models/${productModelId.value}/components"

        val result =
            mockMvc
                .perform(
                    post(url)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin())
                        .content(payload),
                ).andExpect(status().isCreated)
                .andReturn()

        val parsedResult = readResponse<ComponentDto>(result)

        assertNotNull(parsedResult)
        assertEquals("TOP", parsedResult.code)
        assertEquals("Table Top", parsedResult.label)
        assertEquals("The top surface of the table", parsedResult.description)
        assertEquals(1, parsedResult.sortOrder)
        assertEquals(productModelId.value, parsedResult.productModelId)
    }

    @Test
    fun `Get - returns single component`() {
        val component = Component(
            id = componentId1,
            productModelId = productModelId,
            code = "LEGS",
            label = "Table Legs",
            description = "Four table legs",
            sortOrder = 2,
            createdAt = OffsetDateTime.now(),
            modifiedAt = OffsetDateTime.now(),
        )

        componentRepository.create(component)

        val url = "/products/api/v1/product-models/${productModelId.value}/components/${componentId1.value}"

        val result =
            mockMvc
                .perform(
                    get(url)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<ComponentDto>(result)

        assertNotNull(parsedResult)
        assertEquals(componentId1.value, parsedResult.id)
        assertEquals("LEGS", parsedResult.code)
        assertEquals("Table Legs", parsedResult.label)
        assertEquals(productModelId.value, parsedResult.productModelId)
    }

    @Test
    fun `List - returns paginated components`() {
        val component1 = Component(
            id = componentId1,
            productModelId = productModelId,
            code = "TOP",
            label = "Table Top",
            description = null,
            sortOrder = 1,
            createdAt = OffsetDateTime.now(),
            modifiedAt = OffsetDateTime.now(),
        )

        val component2 = Component(
            id = componentId2,
            productModelId = productModelId,
            code = "LEGS",
            label = "Table Legs",
            description = null,
            sortOrder = 2,
            createdAt = OffsetDateTime.now(),
            modifiedAt = OffsetDateTime.now(),
        )

        componentRepository.create(component1)
        componentRepository.create(component2)

        val url = "/products/api/v1/product-models/${productModelId.value}/components"

        val result =
            mockMvc
                .perform(
                    get(url)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<ComponentPaginatedResponseDto>(result)

        assertNotNull(parsedResult)
        assertEquals(2, parsedResult.items.size)
        assertEquals("TOP", parsedResult.items[0].code)
        assertEquals("LEGS", parsedResult.items[1].code)
    }

    @Test
    fun `Delete - deletes component`() {
        val component = Component(
            id = componentId1,
            productModelId = productModelId,
            code = "DOOR",
            label = "Door",
            description = null,
            sortOrder = 3,
            createdAt = OffsetDateTime.now(),
            modifiedAt = OffsetDateTime.now(),
        )

        componentRepository.create(component)

        assertEquals(1, componentRepository.findByFilter().size)

        val url = "/products/api/v1/product-models/${productModelId.value}/components/${componentId1.value}"

        mockMvc
            .perform(
                delete(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin()),
            ).andExpect(status().isNoContent)

        assertEquals(0, componentRepository.findByFilter().size)
    }
}

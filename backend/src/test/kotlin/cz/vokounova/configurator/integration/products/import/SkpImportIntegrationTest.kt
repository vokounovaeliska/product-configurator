package cz.vokounova.configurator.integration.products.import

import cz.vokounova.configurator.configuration.BaseIntegrationTest
import cz.vokounova.configurator.generated.jooq.enums.AttributeType
import cz.vokounova.configurator.generated.jooq.tables.references.USER
import cz.vokounova.configurator.mocks.AuthMocks
import cz.vokounova.configurator.mocks.UserMocks
import cz.vokounova.configurator.products.attributes.domain.AttributeFilter
import cz.vokounova.configurator.products.attributes.ports.outbound.AttributeRepository
import cz.vokounova.configurator.products.components.domain.ComponentFilter
import cz.vokounova.configurator.products.components.ports.outbound.ComponentRepository
import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.ports.outboud.UserRepository
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.mock.web.MockMultipartFile
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.UUID
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

class SkpImportIntegrationTest : BaseIntegrationTest() {
    @Autowired
    protected lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var attributeRepository: AttributeRepository

    @Autowired
    lateinit var componentRepository: ComponentRepository

    @Autowired
    lateinit var userRepository: UserRepository

    private val userId = UserId(UUID.fromString("a1b16dcb-b885-4783-b085-358a97e7e71e"))

    @BeforeEach
    override fun setup() {
        super.setup()
        val user = UserMocks.getUser(id = userId)
        userRepository.create(user)
    }

    @AfterEach
    override fun cleanUp() {
        dslContext.truncate(USER).cascade().execute()
    }

    @Test
    fun `import from configurator zip creates attributes with correct defaults and unit cm`() {
        val parametersJsonBytes =
            javaClass.classLoader
                .getResourceAsStream("parameters.json")
                ?.readBytes()
                ?: throw IllegalStateException("Missing src/test/resources/parameters.json")

        val zipBytes = createConfiguratorZip(parametersJsonBytes, createMinimalGlb())

        val configuratorZipFile =
            MockMultipartFile(
                "configuratorZip",
                "configurator.zip",
                "application/zip",
                zipBytes,
            )

        val result =
            mockMvc
                .perform(
                    multipart("/products/api/v1/import/sketchup")
                        .file(configuratorZipFile)
                        .with(AuthMocks.mockUser(userId = userId, email = "test@test.com")),
                ).andExpect(status().isCreated)
                .andReturn()

        val responseBody = result.response.contentAsString
        assertTrue(responseBody.contains("productModelId"))

        val productModelId =
            objectMapper
                .readTree(responseBody)
                .get("productModelId")
                ?.asText()
                ?: throw AssertionError("Missing productModelId in response")
        val productId = ProductModelId(UUID.fromString(productModelId))

        val components = componentRepository.findByFilter(ComponentFilter(productModelIds = listOf(productId)))
        assertTrue(components.isNotEmpty()) { "Expected at least one component" }

        val componentId = components.first().id
        val attributes =
            attributeRepository.findByFilter(
                AttributeFilter(componentIds = listOf(componentId)),
            )

        assertTrue(attributes.isNotEmpty()) { "Expected attributes to be created" }

        assertTrue(
            attributes.none {
                it.code.endsWith("_LENX") || it.code.endsWith("_LENY") || it.code.endsWith("_LENZ")
            },
        ) { "Per-component _lenx/_leny/_lenz params must not be created as attributes" }

        // Dimension params (length, width, height) from parameters.json must have default and unit cm
        // Import infers them as INTEGER with defaultInt
        fun assertDefaultInt(
            attr: cz.vokounova.configurator.products.attributes.domain.Attribute?,
            expected: Int,
            label: String,
        ) {
            assertNotNull(attr) { "Expected $label attribute" }
            val actual = attr!!.defaultInt
            assertNotNull(actual) { "$label defaultInt should be $expected" }
            assertEquals(expected, actual, "$label defaultInt")
        }

        val length = attributes.find { it.code == "LENGTH" }
        assertDefaultInt(length, 120, "LENGTH")
        assertEquals("cm", length!!.unit)

        val height = attributes.find { it.code == "HEIGHT" }
        assertDefaultInt(height, 55, "HEIGHT")
        assertEquals("cm", height!!.unit)

        val width = attributes.find { it.code == "WIDTH" }
        assertDefaultInt(width, 80, "WIDTH")
        assertEquals("cm", width!!.unit)

        // ENUM param (bottom_color) with default null must have null defaultDecimal
        val bottomColor = attributes.find { it.code == "BOTTOM_COLOR" }
        assertNotNull(bottomColor) { "Expected BOTTOM_COLOR attribute" }
        assertEquals(AttributeType.ENUM, bottomColor!!.type)
        assertEquals(null, bottomColor.defaultDecimal)
    }

    private fun createConfiguratorZip(
        jsonBytes: ByteArray,
        glbBytes: ByteArray,
    ): ByteArray {
        val outputStream = java.io.ByteArrayOutputStream()
        ZipOutputStream(outputStream).use { zos ->
            zos.putNextEntry(ZipEntry("parameters.json"))
            zos.write(jsonBytes)
            zos.closeEntry()
            zos.putNextEntry(ZipEntry("model.glb"))
            zos.write(glbBytes)
            zos.closeEntry()
        }
        return outputStream.toByteArray()
    }

    /** Minimal valid GLB (glTF 2.0 binary): header + JSON chunk with empty scene. */
    private fun createMinimalGlb(): ByteArray {
        val json = """{"asset":{"version":"2.0"},"scene":0,"scenes":[{"nodes":[]}]}""".toByteArray(Charsets.UTF_8)
        val chunkLength = json.size
        val padding = (4 - chunkLength % 4) % 4
        val totalLength = 12 + 8 + chunkLength + padding

        return ByteArray(12 + 8 + chunkLength + padding).apply {
            var offset = 0
            // Header: magic glTF, version 2, length
            "glTF".toByteArray(Charsets.US_ASCII).copyInto(this, offset)
            offset += 4
            this[offset] = 2
            offset += 4
            this[offset] = (totalLength and 0xFF).toByte()
            this[offset + 1] = (totalLength shr 8 and 0xFF).toByte()
            this[offset + 2] = (totalLength shr 16 and 0xFF).toByte()
            this[offset + 3] = (totalLength shr 24 and 0xFF).toByte()
            offset += 4
            // Chunk: type JSON (0x4E4F534A), length
            this[offset] = 0x4A
            this[offset + 1] = 0x53
            this[offset + 2] = 0x4F
            this[offset + 3] = 0x4E
            offset += 4
            this[offset] = (chunkLength and 0xFF).toByte()
            this[offset + 1] = (chunkLength shr 8 and 0xFF).toByte()
            this[offset + 2] = (chunkLength shr 16 and 0xFF).toByte()
            this[offset + 3] = (chunkLength shr 24 and 0xFF).toByte()
            offset += 4
            json.copyInto(this, offset)
        }
    }
}

package cz.vokounova.configurator.integration.products.import

import cz.vokounova.configurator.configuration.BaseIntegrationTest
import cz.vokounova.configurator.generated.jooq.tables.references.USER
import cz.vokounova.configurator.mocks.AuthMocks
import cz.vokounova.configurator.mocks.UserMocks
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.ports.outboud.UserRepository
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.mock.web.MockMultipartFile
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.UUID

class SkpImportControllerErrorsTest : BaseIntegrationTest() {
    companion object {
        private const val SKP_IMPORT_URL = "/products/api/v1/import/sketchup"
    }

    @Autowired
    protected lateinit var mockMvc: MockMvc

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
    fun `Import - BadRequest - when configuratorZip is empty`() {
        val emptyFile =
            MockMultipartFile(
                "configuratorZip",
                "configurator.zip",
                "application/zip",
                ByteArray(0),
            )

        val result =
            mockMvc
                .perform(
                    multipart(SKP_IMPORT_URL)
                        .file(emptyFile)
                        .with(AuthMocks.mockUser(userId = userId, email = "test@test.com")),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val responseBody = objectMapper.readTree(result.response.contentAsString)
        assertEquals(false, responseBody.get("success").asBoolean())
        assertNotNull(responseBody.get("error").asText())
        assertEquals("configuratorZip is required", responseBody.get("error").asText())
    }

    @Test
    fun `Import - BadRequest - when file is not zip`() {
        val nonZipFile =
            MockMultipartFile(
                "configuratorZip",
                "configurator.txt",
                "text/plain",
                "not a zip file".toByteArray(),
            )

        val result =
            mockMvc
                .perform(
                    multipart(SKP_IMPORT_URL)
                        .file(nonZipFile)
                        .with(AuthMocks.mockUser(userId = userId, email = "test@test.com")),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val responseBody = objectMapper.readTree(result.response.contentAsString)
        assertEquals(false, responseBody.get("success").asBoolean())
        assertNotNull(responseBody.get("error").asText())
        assertEquals(
            "configuratorZip must be a .zip file (model.glb + parameters.json + materials/)",
            responseBody.get("error").asText(),
        )
    }

    @Test
    fun `Import - Unauthorized - when authentication is missing`() {
        val zipFile =
            MockMultipartFile(
                "configuratorZip",
                "configurator.zip",
                "application/zip",
                byteArrayOf(0x50, 0x4b, 0x05, 0x06), // minimal zip header
            )

        mockMvc
            .perform(
                multipart(SKP_IMPORT_URL)
                    .file(zipFile),
            ).andExpect(status().isUnauthorized)
    }
}

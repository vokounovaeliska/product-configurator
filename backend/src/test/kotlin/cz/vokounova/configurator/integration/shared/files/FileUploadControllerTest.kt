package cz.vokounova.configurator.integration.shared.files

import cz.vokounova.configurator.configuration.BaseIntegrationTest
import cz.vokounova.configurator.generated.jooq.tables.references.USER
import cz.vokounova.configurator.mocks.AuthMocks
import cz.vokounova.configurator.mocks.UserMocks
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

class FileUploadControllerTest : BaseIntegrationTest() {
    companion object {
        private const val FILES_UPLOAD_URL = "/api/v1/files/upload"
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
    fun `Upload - uploads valid png file`() {
        val pngContent =
            byteArrayOf(
                0x89.toByte(),
                0x50,
                0x4e,
                0x47,
                0x0d,
                0x0a,
                0x1a,
                0x0a,
            ) // PNG header
        val file =
            MockMultipartFile(
                "file",
                "test-image.png",
                "image/png",
                pngContent,
            )

        val result =
            mockMvc
                .perform(
                    multipart(FILES_UPLOAD_URL)
                        .file(file)
                        .with(AuthMocks.mockUser(userId = userId, email = "test@test.com")),
                ).andExpect(status().isOk)
                .andReturn()

        val responseBody = objectMapper.readTree(result.response.contentAsString)
        assertEquals(true, responseBody.get("success").asBoolean())
        assertNotNull(responseBody.get("url").asText())
        assertTrue(responseBody.get("url").asText().contains("/api/v1/files/"))
        assertTrue(responseBody.get("url").asText().endsWith(".png"))
    }

    @Test
    fun `Upload - BadRequest - when file is empty`() {
        val emptyFile =
            MockMultipartFile(
                "file",
                "empty.png",
                "image/png",
                ByteArray(0),
            )

        val result =
            mockMvc
                .perform(
                    multipart(FILES_UPLOAD_URL)
                        .file(emptyFile)
                        .with(AuthMocks.mockUser(userId = userId, email = "test@test.com")),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val responseBody = objectMapper.readTree(result.response.contentAsString)
        assertEquals(false, responseBody.get("success").asBoolean())
        assertEquals("File is empty", responseBody.get("message").asText())
    }

    @Test
    fun `Upload - BadRequest - when file extension is invalid`() {
        val invalidFile =
            MockMultipartFile(
                "file",
                "document.pdf",
                "application/pdf",
                "pdf content".toByteArray(),
            )

        val result =
            mockMvc
                .perform(
                    multipart(FILES_UPLOAD_URL)
                        .file(invalidFile)
                        .with(AuthMocks.mockUser(userId = userId, email = "test@test.com")),
                ).andExpect(status().isBadRequest)
                .andReturn()

        val responseBody = objectMapper.readTree(result.response.contentAsString)
        assertEquals(false, responseBody.get("success").asBoolean())
        assertTrue(responseBody.get("message").asText().contains("Invalid file type"))
    }

    @Test
    fun `Upload - Unauthorized - when authentication is missing`() {
        val file =
            MockMultipartFile(
                "file",
                "test.png",
                "image/png",
                byteArrayOf(0x89.toByte(), 0x50, 0x4e, 0x47),
            )

        mockMvc
            .perform(
                multipart(FILES_UPLOAD_URL)
                    .file(file),
            ).andExpect(status().isUnauthorized)
    }
}

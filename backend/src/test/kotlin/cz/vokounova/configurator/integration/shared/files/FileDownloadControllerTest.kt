package cz.vokounova.configurator.integration.shared.files

import cz.vokounova.configurator.configuration.BaseIntegrationTest
import cz.vokounova.configurator.generated.jooq.tables.references.USER
import cz.vokounova.configurator.mocks.UserMocks
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.ports.outbound.UserRepository
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.nio.file.Files
import java.nio.file.Paths
import java.util.UUID

class FileDownloadControllerTest : BaseIntegrationTest() {
    companion object {
        private const val FILES_URL = "/api/v1/files"
    }

    @Autowired
    protected lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var userRepository: UserRepository

    @Value("\${app.files.upload-dir}")
    lateinit var uploadDir: String

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
    fun `Get - Returns file when it exists`() {
        val uploadPath = Paths.get(uploadDir)
        Files.createDirectories(uploadPath)

        val filename = "${UUID.randomUUID()}.png"
        val filePath = uploadPath.resolve(filename)
        val content = "fake-png-content".toByteArray()
        Files.write(filePath, content)

        try {
            val result =
                mockMvc
                    .perform(
                        get("$FILES_URL/$filename")
                            .contentType(MediaType.APPLICATION_JSON),
                    ).andExpect(status().isOk)
                    .andReturn()

            assertEquals(content.size, result.response.contentLength)
            assertTrue(result.response.contentAsByteArray.contentEquals(content))
        } finally {
            Files.deleteIfExists(filePath)
        }
    }

    @Test
    fun `Get - NotFound - when file does not exist`() {
        val nonExistentFilename = "${UUID.randomUUID()}.png"

        mockMvc
            .perform(
                get("$FILES_URL/$nonExistentFilename")
                    .contentType(MediaType.APPLICATION_JSON),
            ).andExpect(status().isNotFound)
    }

    @Test
    fun `Get - BadRequest - when filename contains path traversal`() {
        mockMvc
            .perform(
                get("$FILES_URL/../application.yaml")
                    .contentType(MediaType.APPLICATION_JSON),
            ).andExpect(status().isBadRequest)
    }
}

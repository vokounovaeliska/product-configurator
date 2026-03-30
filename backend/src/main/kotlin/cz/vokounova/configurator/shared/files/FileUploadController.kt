package cz.vokounova.configurator.shared.files

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import java.nio.file.AccessDeniedException
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.util.UUID

@Tag(
    name = "Files",
    description = "Upload and download user assets (images, GLB) stored server-side; returned URLs work with the download endpoint.",
)
@RestController
@RequestMapping("/api/v1/files")
class FileUploadController(
    @Value("\${app.files.upload-dir}") private val uploadDir: String,
) {
    companion object {
        private val log = LoggerFactory.getLogger(FileUploadController::class.java)
        private val ALLOWED_EXTENSIONS = setOf("jpg", "jpeg", "png", "gif", "webp", "svg", "glb")
        private const val MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    }

    init {
        // Try to create upload directory at startup; do not fail bean creation if e.g. read-only filesystem
        try {
            ensureUploadDirExists(Paths.get(uploadDir))
            log.info("File upload directory: {}", Paths.get(uploadDir).toAbsolutePath())
        } catch (e: Exception) {
            log.warn(
                "Upload directory not writable at startup: {} ({}: {})",
                uploadDir,
                e.javaClass.simpleName,
                e.message,
            )
            // Directory will be created on first upload if permitted
        }
    }

    private fun ensureUploadDirExists(uploadPath: Path) {
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath)
        }
    }

    @Operation(
        summary = "Upload file",
        description = "Multipart upload; allowed extensions: jpg, png, gif, webp, svg, glb. Max size 10 MB. Returns a relative URL for use in the app.",
    )
    @PostMapping("/upload", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun uploadFile(
        @RequestParam("file") file: MultipartFile,
    ): ResponseEntity<FileUploadResponse> {
        // Validate file
        if (file.isEmpty) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(FileUploadResponse(success = false, message = "File is empty", url = null))
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(FileUploadResponse(success = false, message = "File size exceeds 10MB limit", url = null))
        }

        // Validate file extension
        val originalFilename = file.originalFilename ?: ""
        val extension = originalFilename.substringAfterLast('.', "").lowercase()
        if (extension !in ALLOWED_EXTENSIONS) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(
                    FileUploadResponse(
                        success = false,
                        message = "Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.joinToString(", ")}",
                        url = null,
                    ),
                )
        }

        try {
            val uploadPath = Paths.get(uploadDir)
            ensureUploadDirExists(uploadPath)

            // Generate unique filename
            val uniqueFilename = "${UUID.randomUUID()}.$extension"
            val filePath = uploadPath.resolve(uniqueFilename)

            // Save file
            Files.write(filePath, file.bytes)

            // Return URL - in production, this should be configured to return full CDN/storage URL
            // For now, return relative path that will be served by FileDownloadController
            val fileUrl = "/api/v1/files/$uniqueFilename"

            return ResponseEntity
                .status(HttpStatus.OK)
                .body(FileUploadResponse(success = true, message = "File uploaded successfully", url = fileUrl))
        } catch (e: AccessDeniedException) {
            log.error("File upload denied: path={}, message={}", uploadDir, e.message, e)
            return ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(
                    FileUploadResponse(
                        success = false,
                        message = "File upload is not available: the server does not have write access to the upload directory.",
                        url = null,
                    ),
                )
        } catch (e: Exception) {
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(FileUploadResponse(success = false, message = "Failed to upload file: ${e.message}", url = null))
        }
    }
}

data class FileUploadResponse(
    val success: Boolean,
    val message: String,
    val url: String?,
)

package cz.vokounova.configurator.shared.files

import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import java.io.File
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.util.UUID

@RestController
@RequestMapping("/api/v1/files")
class FileUploadController {
    companion object {
        private const val UPLOAD_DIR = "uploads/images"
        private val ALLOWED_EXTENSIONS = setOf("jpg", "jpeg", "png", "gif", "webp", "svg")
        private const val MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    }

    init {
        // Create upload directory if it doesn't exist
        val uploadPath = Paths.get(UPLOAD_DIR)
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath)
        }
    }

    @PostMapping("/upload", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun uploadFile(
        @RequestParam("file") file: MultipartFile,
    ): ResponseEntity<FileUploadResponse> {
        // Validate file
        if (file.isEmpty) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(FileUploadResponse(success = false, message = "File is empty", url = null))
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(FileUploadResponse(success = false, message = "File size exceeds 10MB limit", url = null))
        }

        // Validate file extension
        val originalFilename = file.originalFilename ?: ""
        val extension = originalFilename.substringAfterLast('.', "").lowercase()
        if (extension !in ALLOWED_EXTENSIONS) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(
                    FileUploadResponse(
                        success = false,
                        message = "Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.joinToString(", ")}",
                        url = null,
                    ),
                )
        }

        try {
            // Generate unique filename
            val uniqueFilename = "${UUID.randomUUID()}.$extension"
            val filePath = Paths.get(UPLOAD_DIR, uniqueFilename)

            // Save file
            Files.write(filePath, file.bytes)

            // Return URL - in production, this should be configured to return full CDN/storage URL
            // For now, return relative path that will be served by FileDownloadController
            val fileUrl = "/api/v1/files/$uniqueFilename"

            return ResponseEntity.status(HttpStatus.OK)
                .body(FileUploadResponse(success = true, message = "File uploaded successfully", url = fileUrl))
        } catch (e: Exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(FileUploadResponse(success = false, message = "Failed to upload file: ${e.message}", url = null))
        }
    }
}

data class FileUploadResponse(
    val success: Boolean,
    val message: String,
    val url: String?,
)

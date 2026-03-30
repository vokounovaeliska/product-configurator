package cz.vokounova.configurator.shared.files

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.FileSystemResource
import org.springframework.core.io.Resource
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.nio.file.Files
import java.nio.file.Paths

@Tag(
    name = "Files",
    description = "Upload and download user assets (images, GLB) stored server-side; returned URLs work with the download endpoint.",
)
@RestController
@RequestMapping("/api/v1/files")
class FileDownloadController(
    @Value("\${app.files.upload-dir}") private val uploadDir: String,
) {
    @Operation(
        summary = "Download file by name",
        description = "Streams a previously uploaded file from storage (Content-Type inferred).",
    )
    @GetMapping("/{filename}")
    fun getFile(
        @PathVariable filename: String,
    ): ResponseEntity<Resource> {
        val filePath = Paths.get(uploadDir, filename)
        val file = filePath.toFile()

        if (!file.exists() || !file.isFile) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        }

        val resource = FileSystemResource(file)
        val contentType = Files.probeContentType(filePath) ?: "application/octet-stream"

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"${file.name}\"")
            .body(resource)
    }
}

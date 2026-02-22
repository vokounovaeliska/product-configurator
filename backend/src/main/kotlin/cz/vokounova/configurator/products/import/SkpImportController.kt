package cz.vokounova.configurator.products.import

import cz.vokounova.configurator.shared.security.AuthFacade
import cz.vokounova.configurator.users.api.dto.UserIdDto
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/products/api/v1/import")
class SkpImportController(
    private val skpImportService: SkpImportService,
    private val authFacade: AuthFacade,
) {
    @PostMapping(
        "/sketchup",
        consumes = [MediaType.MULTIPART_FORM_DATA_VALUE],
    )
    fun importFromSketchUp(
        @RequestParam("skp") skpFile: MultipartFile,
        @RequestParam("glb") glbFile: MultipartFile,
        @RequestParam("name", required = false) productName: String?,
    ): ResponseEntity<SkpImportResponse> {
        if (skpFile.isEmpty) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(SkpImportResponse(success = false, productModelId = null, error = "SKP file is required"))
        }
        val filename = skpFile.originalFilename ?: ""
        if (!filename.lowercase().endsWith(".skp")) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(SkpImportResponse(success = false, productModelId = null, error = "Invalid SKP file type"))
        }
        val glbFilename = glbFile.originalFilename ?: ""
        if (glbFile.isEmpty || !glbFilename.lowercase().endsWith(".glb")) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(SkpImportResponse(success = false, productModelId = null, error = "Valid GLB file is required"))
        }

        val userId = UserIdDto(authFacade.getCurrentAuthDetails().id().value)
        val result = skpImportService.importFromSketchUp(skpFile, glbFile, userId, productName)

        return if (result.success) {
            ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                    SkpImportResponse(
                        success = true,
                        productModelId = result.productModelId,
                        error = null,
                    ),
                )
        } else {
            ResponseEntity
                .status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(
                    SkpImportResponse(
                        success = false,
                        productModelId = null,
                        error = result.error,
                    ),
                )
        }
    }
}

data class SkpImportResponse(
    val success: Boolean,
    val productModelId: java.util.UUID?,
    val error: String?,
)

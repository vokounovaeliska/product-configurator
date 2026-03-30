package cz.vokounova.configurator.products.import

import cz.vokounova.configurator.shared.security.AuthFacade
import cz.vokounova.configurator.users.api.dto.UserIdDto
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile

@Tag(
    name = "SketchUp import",
    description = "Upload Konfiguruj / SketchUp exporter zip (GLB + parameters.json + materials) to create or update a product model.",
)
@RestController
@RequestMapping("/products/api/v1/import")
class SkpImportController(
    private val skpImportService: SkpImportService,
    private val authFacade: AuthFacade,
) {
    @Operation(
        summary = "Import from configurator zip",
        description = "Multipart upload of .zip containing model.glb, parameters.json, and optional materials/. Returns new product model id on success.",
    )
    @PostMapping(
        "/sketchup",
        consumes = [MediaType.MULTIPART_FORM_DATA_VALUE],
    )
    fun importFromConfiguratorZip(
        @RequestParam("configuratorZip") configuratorZip: MultipartFile,
        @RequestParam("name", required = false) productName: String?,
    ): ResponseEntity<SkpImportResponse> {
        if (configuratorZip.isEmpty) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(
                    SkpImportResponse(
                        success = false,
                        productModelId = null,
                        error = "configuratorZip is required",
                    ),
                )
        }
        val filename = configuratorZip.originalFilename ?: ""
        if (!filename.lowercase().endsWith(".zip")) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(
                    SkpImportResponse(
                        success = false,
                        productModelId = null,
                        error = "configuratorZip must be a .zip file (model.glb + parameters.json + materials/)",
                    ),
                )
        }

        val userId = UserIdDto(authFacade.getCurrentAuthDetails().id().value)
        val result =
            skpImportService.importFromConfiguratorZip(
                configuratorZip,
                userId,
                productName,
            )

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

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
        @RequestParam("skp", required = false) skpFile: MultipartFile?,
        @RequestParam("glb", required = false) glbFile: MultipartFile?,
        @RequestParam("name", required = false) productName: String?,
        @RequestParam("parametersJson", required = false) parametersJson: MultipartFile?,
        @RequestParam("parametersZip", required = false) parametersZip: MultipartFile?,
        @RequestParam("configuratorZip", required = false) configuratorZip: MultipartFile?,
    ): ResponseEntity<SkpImportResponse> {
        val useConfiguratorZip =
            configuratorZip != null &&
                !configuratorZip.isEmpty &&
                configuratorZip.originalFilename?.lowercase()?.endsWith(".zip") == true
        val useParametersZip =
            parametersZip != null &&
                !parametersZip.isEmpty &&
                parametersZip.originalFilename?.lowercase()?.endsWith(".zip") == true
        val useParametersJson =
            parametersJson != null &&
                !parametersJson.isEmpty &&
                parametersJson.originalFilename?.lowercase()?.endsWith(".json") == true
        val useSkp = skpFile != null && !skpFile.isEmpty

        if (!useSkp && !useParametersZip && !useParametersJson && !useConfiguratorZip) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(
                    SkpImportResponse(
                        success = false,
                        productModelId = null,
                        error = "SKP file, parameters.json, parameters.zip, or configurator.zip is required",
                    ),
                )
        }
        if (useSkp) {
            val filename = skpFile!!.originalFilename ?: ""
            if (!filename.lowercase().endsWith(".skp")) {
                return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(SkpImportResponse(success = false, productModelId = null, error = "Invalid SKP file type"))
            }
        }
        if (useParametersZip) {
            val filename = parametersZip!!.originalFilename ?: ""
            if (!filename.lowercase().endsWith(".zip")) {
                return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(SkpImportResponse(success = false, productModelId = null, error = "Invalid parameters.zip file type"))
            }
        }
        if (useConfiguratorZip) {
            val filename = configuratorZip!!.originalFilename ?: ""
            if (!filename.lowercase().endsWith(".zip")) {
                return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(SkpImportResponse(success = false, productModelId = null, error = "Invalid configurator.zip file type"))
            }
        }
        val glbProvided = glbFile != null && !glbFile.isEmpty && (glbFile.originalFilename?.lowercase()?.endsWith(".glb") == true)
        if (!useConfiguratorZip && !glbProvided) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(
                    SkpImportResponse(
                        success = false,
                        productModelId = null,
                        error = "Valid GLB file is required (or use configurator.zip with GLB inside)",
                    ),
                )
        }

        val userId = UserIdDto(authFacade.getCurrentAuthDetails().id().value)
        val result =
            skpImportService.importFromSketchUp(
                skpFile,
                glbFile,
                userId,
                productName,
                parametersJson,
                parametersZip,
                configuratorZip,
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

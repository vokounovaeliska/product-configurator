package cz.vokounova.configurator.shared.skp

import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/products/api/v1/skp")
class SkpExtractController {
    @PostMapping(
        "/extract-parameters",
        consumes = [MediaType.MULTIPART_FORM_DATA_VALUE],
    )
    fun extractParameters(
        @RequestParam("file") file: MultipartFile,
    ): ResponseEntity<SkpExtractResponse> {
        if (file.isEmpty) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(
                    SkpExtractResponse(
                        success = false,
                        parameters = emptyList(),
                        error = "File is empty",
                    ),
                )
        }
        val filename = file.originalFilename ?: ""
        if (!filename.lowercase().endsWith(".skp")) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(
                    SkpExtractResponse(
                        success = false,
                        parameters = emptyList(),
                        error = "Invalid file type. Expected .skp",
                    ),
                )
        }
        val result = SkpParameterExtractor.extractParametersFromBytes(file.bytes)
        return ResponseEntity.ok(
            SkpExtractResponse(
                success = result.isSuccess,
                parameters = result.parameters,
                rootComponent = result.rootComponent,
                meshNames = result.meshNames,
                materialColors = result.materialColors,
                error = result.error,
            ),
        )
    }
}

data class SkpExtractResponse(
    val success: Boolean,
    val parameters: List<SkpParameter>,
    val rootComponent: String = "Default",
    val meshNames: List<String> = emptyList(),
    val materialColors: Map<String, String> = emptyMap(),
    val error: String? = null,
)

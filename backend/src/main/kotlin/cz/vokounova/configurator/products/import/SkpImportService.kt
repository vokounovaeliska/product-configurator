package cz.vokounova.configurator.products.import

import cz.vokounova.configurator.generated.jooq.enums.AttributeType
import cz.vokounova.configurator.products.attributes.domain.Attribute
import cz.vokounova.configurator.products.attributes.domain.AttributeCreateParams
import cz.vokounova.configurator.products.attributes.domain.AttributeOptionCreateParams
import cz.vokounova.configurator.products.attributes.ports.inbound.AttributeAPI
import cz.vokounova.configurator.products.attributes.ports.inbound.AttributeOptionAPI
import cz.vokounova.configurator.products.components.domain.Component
import cz.vokounova.configurator.products.components.domain.ComponentCreateParams
import cz.vokounova.configurator.products.components.ports.inbound.ComponentAPI
import cz.vokounova.configurator.products.models.domain.ProductModelCreateParams
import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.products.models.domain.ProductModelJsonPatchParams
import cz.vokounova.configurator.products.models.domain.ProductModelJsonPatchParamsPath
import cz.vokounova.configurator.products.models.ports.inbound.ProductModelAPI
import cz.vokounova.configurator.products.pricing.DefaultPricingRulesService
import cz.vokounova.configurator.shared.rest.jsonpatch.JsonPatchOperation
import cz.vokounova.configurator.shared.skp.ParametersJsonParser
import cz.vokounova.configurator.shared.skp.SkpParameter
import cz.vokounova.configurator.shared.skp.SkpParameterExtractionResult
import cz.vokounova.configurator.users.api.dto.UserIdDto
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import java.io.ByteArrayInputStream
import java.math.BigDecimal
import java.nio.file.Files
import java.nio.file.Paths
import java.util.UUID
import java.util.zip.ZipInputStream

/**
 * Orchestrates import of a product from configurator ZIP (model.glb + parameters.json + materials/).
 * Extracts parameters from parameters.json, creates product model, components, attributes, options,
 * stores the GLB and textures, and sets model_3d_url and model_3d_effects.
 */
@Service
class SkpImportService(
    private val productModelAPI: ProductModelAPI,
    private val componentAPI: ComponentAPI,
    private val attributeAPI: AttributeAPI,
    private val attributeOptionAPI: AttributeOptionAPI,
    private val defaultPricingRulesService: DefaultPricingRulesService,
    @Value("\${app.files.upload-dir}") private val uploadDir: String,
) {
    fun importFromConfiguratorZip(
        configuratorZip: MultipartFile,
        userId: UserIdDto,
        productName: String? = null,
    ): SkpImportResult {
        val (skpResult: SkpParameterExtractionResult, glbBytes: ByteArray?) =
            try {
                val extracted = extractConfiguratorZip(configuratorZip.bytes)
                val result = ParametersJsonParser.parse(extracted.jsonBytes, extracted.textures)
                result to extracted.glbBytes
            } catch (e: Exception) {
                return SkpImportResult(
                    success = false,
                    productModelId = null,
                    error = "Invalid configurator.zip: ${e.message}",
                )
            }

        if (!skpResult.isSuccess) {
            return SkpImportResult(success = false, productModelId = null, error = skpResult.error)
        }

        if (glbBytes == null || glbBytes.isEmpty()) {
            return SkpImportResult(
                success = false,
                productModelId = null,
                error = "Configurator zip must contain model.glb",
            )
        }

        val name =
            productName
                ?: configuratorZip.originalFilename?.removeSuffix(".zip")
                ?: "Imported Product"
        val productModel =
            productModelAPI.create(
                ProductModelCreateParams(
                    userId = userId,
                    name = name,
                    description = "Imported from SketchUp",
                    price = 0.0,
                    currency = "CZK",
                    isActive = true,
                ),
            )

        val rootComponent = skpResult.rootComponent
        val component = createSingleComponent(productModel.id, rootComponent)

        val merchantParams = filterMerchantRelevantParams(skpResult.parameters)
        val attributes = createAttributes(merchantParams, component, productModel.id)
        val materialTextureUrls = storeMaterialTextures(skpResult.materialTextures)
        createAttributeOptions(attributes, materialTextureUrls, productModel.id)

        val patches = mutableListOf<ProductModelJsonPatchParams>()
        val model3dUrl = storeGlbFromBytes(glbBytes!!)
        if (model3dUrl != null) {
            patches.add(
                ProductModelJsonPatchParams(
                    path = ProductModelJsonPatchParamsPath.MODEL_3D_URL,
                    value = model3dUrl,
                    op = JsonPatchOperation.REPLACE,
                ),
            )
        }
        if (skpResult.componentTransforms.isNotEmpty() || skpResult.model3dEffects.isNotEmpty()) {
            val model3dPayload =
                when {
                    skpResult.componentTransforms.isNotEmpty() -> {
                        val payload =
                            mutableMapOf<String, Any?>(
                                "componentTransforms" to skpResult.componentTransforms,
                            )
                        if (skpResult.model3dEffects.isNotEmpty()) {
                            payload["effects"] = skpResult.model3dEffects
                        }
                        if (skpResult.parameterDefaults.isNotEmpty()) {
                            payload["parameterDefaults"] = skpResult.parameterDefaults
                        }
                        if (materialTextureUrls.isNotEmpty()) {
                            payload["materials"] =
                                materialTextureUrls.mapValues { (_, url) ->
                                    mapOf("textureUrl" to url)
                                }
                        }
                        payload
                    }
                    else -> skpResult.model3dEffects
                }
            val effectsJson =
                com.fasterxml.jackson.databind.ObjectMapper()
                    .writeValueAsString(model3dPayload)
            patches.add(
                ProductModelJsonPatchParams(
                    path = ProductModelJsonPatchParamsPath.MODEL_3D_EFFECTS,
                    value = effectsJson,
                    op = JsonPatchOperation.REPLACE,
                ),
            )
        }
        if (patches.isNotEmpty()) {
            productModelAPI.patch(productModel.id, patches)
        }

        return SkpImportResult(success = true, productModelId = productModel.id.value, error = null)
    }

    /**
     * Keeps merchant-relevant params for pricing and config.
     * Supports both old SKP DC format (color_X, thickness_X) and plugin parameters.json
     * (X_color, X_thickness, width, height, lenx/y/z).
     */
    private fun filterMerchantRelevantParams(params: List<SkpParameter>): List<SkpParameter> {
        val hasDiameter =
            params.any { it.name == "diameter" } || params.any { it.name.startsWith("diameter_") }
        return params.filter { param ->
            val n = param.name.lowercase()
            if (n in INTERNAL_SKP_PARAMS) return@filter false
            when {
                n.endsWith("_lenx") || n.endsWith("_leny") || n.endsWith("_lenz") -> false
                n.startsWith("color") || n.endsWith("_color") -> true
                n == "diameter" || n.startsWith("diameter_") -> true
                n == "thickness" ||
                    n.startsWith("thickness_") ||
                    n.endsWith("_thickness") ->
                    true
                n.contains("count") || n.contains("leg") || n.contains("visibility") -> true
                n in listOf("lenx", "leny", "lenz") -> !hasDiameter
                n in listOf("width", "depth", "height", "sirka", "hloubka", "vyska") -> true
                else -> false
            }
        }
    }

    private fun createSingleComponent(
        productModelId: ProductModelId,
        name: String,
    ): Component {
        val code =
            name
                .uppercase()
                .replace(Regex("[^A-Z0-9]"), "_")
                .take(50)
                .ifEmpty { "DEFAULT" }
        return componentAPI.create(
            ComponentCreateParams(
                productModelId = productModelId,
                code = code,
                label = name,
                description = null,
                sortOrder = 0,
            ),
        )
    }

    private fun createAttributes(
        parameters: List<SkpParameter>,
        component: Component,
        productModelId: ProductModelId,
    ): List<Pair<Attribute, SkpParameter>> {
        val created = mutableListOf<Pair<Attribute, SkpParameter>>()
        parameters.forEachIndexed { index, param ->
            val inference = inferAttributeType(param)
            val defaultDecimal =
                param.defaultDouble?.let { BigDecimal.valueOf(it) }
                    ?.takeIf { inference.type == AttributeType.DECIMAL }
            val defaultInt =
                param.defaultDouble?.toInt()?.takeIf { inference.type == AttributeType.INTEGER }
            val attribute =
                attributeAPI.create(
                    AttributeCreateParams(
                        componentId = component.id,
                        code = param.name.uppercase().replace(Regex("[^A-Z0-9_]"), "_"),
                        label = param.label.ifEmpty { param.name },
                        type = inference.type,
                        isRequired = true,
                        minInt = inference.minInt,
                        maxInt = inference.maxInt,
                        minDecimal = inference.minDecimal,
                        maxDecimal = inference.maxDecimal,
                        defaultInt = defaultInt,
                        defaultDecimal = defaultDecimal,
                        unit =
                            param.unit.takeIf { it.isNotBlank() }
                                ?: "mm".takeIf {
                                    param.name.contains("diameter") ||
                                        param.name.contains("thickness") ||
                                        param.name.contains("len")
                                },
                        sortOrder = index,
                    ),
                )
            when {
                attribute.minInt != null && attribute.maxInt != null &&
                    inference.type == AttributeType.INTEGER ->
                    defaultPricingRulesService.createDefaultsForNumericAttributeIfEmpty(
                        productModelId.value,
                        component.id.value,
                        attribute.code,
                        attribute.minInt.toString(),
                        attribute.maxInt.toString(),
                    )
                attribute.minDecimal != null && attribute.maxDecimal != null &&
                    inference.type == AttributeType.DECIMAL ->
                    defaultPricingRulesService.createDefaultsForNumericAttributeIfEmpty(
                        productModelId.value,
                        component.id.value,
                        attribute.code,
                        attribute.minDecimal.toString(),
                        attribute.maxDecimal.toString(),
                    )
            }
            created.add(attribute to param)
        }
        return created
    }

    private fun inferAttributeType(param: SkpParameter): AttributeTypeInference {
        val n = param.name.lowercase()
        return when {
            n == "material" || n.startsWith("color") || n.endsWith("_color") ->
                AttributeTypeInference(AttributeType.ENUM, null, null, null, null)
            n.contains("count") || (n.contains("leg") && !n.endsWith("_color")) ->
                AttributeTypeInference(AttributeType.INTEGER, null, null, 1, 10)
            n.contains("diameter") ||
                n.contains("thickness") ||
                n.contains("len") ||
                n.endsWith("_lenx") ||
                n.endsWith("_leny") ||
                n.endsWith("_lenz") ||
                n in listOf("width", "depth", "height", "sirka", "hloubka", "vyska") ->
                AttributeTypeInference(AttributeType.INTEGER, null, null, 1, 5000)
            else ->
                AttributeTypeInference(AttributeType.INTEGER, null, null, 1, 5000)
        }
    }

    private fun createAttributeOptions(
        attributesWithParams: List<Pair<Attribute, SkpParameter>>,
        materialTextureUrls: Map<String, String>,
        productModelId: ProductModelId,
    ) {
        attributesWithParams.forEach { (attribute, param) ->
            if (attribute.type == AttributeType.ENUM) {
                val optionNames =
                    when {
                        // Material-type params: use only textured materials from the zip
                        isMaterialTypeParam(param) && materialTextureUrls.isNotEmpty() ->
                            materialTextureUrls.keys.sorted()
                        param.options.isNotEmpty() -> param.options
                        else -> emptyList()
                    }
                optionNames.forEachIndexed { idx, name ->
                    val textureUrl =
                        materialTextureUrls[name] ?: materialTextureUrls[name.lowercase()]
                    if (isMaterialTypeParam(param) && textureUrl == null) return@forEachIndexed
                    val optionValue = name.uppercase().replace(Regex("[^A-Z0-9]"), "_")
                    attributeOptionAPI.create(
                        AttributeOptionCreateParams(
                            attributeId = attribute.id,
                            value = optionValue,
                            label = name.replaceFirstChar { it.uppercase() },
                            imageUrl = textureUrl,
                            sortOrder = idx,
                        ),
                    )
                    defaultPricingRulesService.createDefaultForOptionIfMissing(
                        productModelId.value,
                        attribute.componentId.value,
                        attribute.code,
                        optionValue,
                    )
                }
            }
        }
    }

    private fun isMaterialTypeParam(param: SkpParameter): Boolean {
        val n = param.name.lowercase()
        return n == "material" ||
            n.startsWith("color") ||
            n.endsWith("_color") ||
            n.contains("barva") ||
            param.effects.any { it.type.equals("material", ignoreCase = true) }
    }

    /**
     * Extracts configurator zip (model.glb + parameters.json + materials/).
     * Returns GLB bytes if present, otherwise null.
     */
    private fun extractConfiguratorZip(zipBytes: ByteArray): ConfiguratorZipResult {
        val extracted = extractFromZip(zipBytes, includeGlb = true)
        return ConfiguratorZipResult(
            glbBytes = extracted.glbBytes,
            jsonBytes = extracted.jsonBytes,
            textures = extracted.textures,
        )
    }

    private fun extractFromZip(
        zipBytes: ByteArray,
        includeGlb: Boolean,
    ): ZipExtractionResult {
        val textures = mutableMapOf<String, Pair<ByteArray, String>>()
        var jsonBytes: ByteArray? = null
        var glbBytes: ByteArray? = null
        ZipInputStream(ByteArrayInputStream(zipBytes)).use { zis ->
            var entry = zis.nextEntry
            while (entry != null) {
                val entryName = entry.name.replace("\\", "/").trimStart('/')
                val bytes = zis.readBytes()
                when {
                    entryName.equals("parameters.json", ignoreCase = true) ||
                        entryName.endsWith("/parameters.json", ignoreCase = true) ->
                        jsonBytes = bytes
                    includeGlb &&
                        (
                            entryName.lowercase().endsWith(".glb") ||
                                entryName.lowercase().endsWith(".gltf")
                        ) -> {
                        if (glbBytes == null || entryName.lowercase().endsWith(".glb")) {
                            glbBytes = bytes
                        }
                    }
                    entryName.lowercase().endsWith(".png") ||
                        entryName.lowercase().endsWith(".jpg") ||
                        entryName.lowercase().endsWith(".jpeg") -> {
                        val ext = entryName.substringAfterLast('.', "png").lowercase()
                        textures[entryName] = bytes to ext
                    }
                }
                zis.closeEntry()
                entry = zis.nextEntry
            }
        }
        return ZipExtractionResult(
            jsonBytes =
                jsonBytes
                    ?: throw IllegalArgumentException("Zip must contain parameters.json"),
            textures = textures,
            glbBytes = glbBytes,
        )
    }

    private fun storeGlbFromBytes(glbBytes: ByteArray): String {
        val uploadPath = Paths.get(uploadDir)
        Files.createDirectories(uploadPath)
        val uniqueFilename = "${UUID.randomUUID()}.glb"
        val filePath = uploadPath.resolve(uniqueFilename)
        Files.write(filePath, glbBytes)
        return "/api/v1/files/$uniqueFilename"
    }

    private fun storeMaterialTextures(materialTextures: Map<String, Pair<ByteArray, String>>): Map<String, String> {
        if (materialTextures.isEmpty()) return emptyMap()
        val uploadPath = Paths.get(uploadDir)
        Files.createDirectories(uploadPath)
        return materialTextures.mapValues { (_, pair) ->
            val bytes = pair.first
            val ext = pair.second
            val uniqueFilename = "${UUID.randomUUID()}.$ext"
            val filePath = uploadPath.resolve(uniqueFilename)
            Files.write(filePath, bytes)
            "/api/v1/files/$uniqueFilename"
        }
    }

    companion object {
        private val INTERNAL_SKP_PARAMS =
            setOf(
                "onclick",
                "copies",
                "hidden",
                "scaletool",
                "dialogwidth",
                "dialogheight",
                "imageurl",
                "description",
                "summary",
                "itemcode",
                "x",
                "y",
                "z",
                "rotx",
                "roty",
                "rotz",
                "material",
                "copy",
                "scalex",
                "scaley",
                "scalez",
                "name",
                "axislock",
                "facecamera",
            )
    }
}

private data class ZipExtractionResult(
    val jsonBytes: ByteArray,
    val textures: Map<String, Pair<ByteArray, String>>,
    val glbBytes: ByteArray? = null,
)

private data class ConfiguratorZipResult(
    val glbBytes: ByteArray?,
    val jsonBytes: ByteArray,
    val textures: Map<String, Pair<ByteArray, String>>,
)

private data class AttributeTypeInference(
    val type: AttributeType,
    val minDecimal: BigDecimal?,
    val maxDecimal: BigDecimal?,
    val minInt: Int?,
    val maxInt: Int?,
)

data class SkpImportResult(
    val success: Boolean,
    val productModelId: UUID?,
    val error: String?,
)

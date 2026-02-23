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
import cz.vokounova.configurator.shared.skp.SkpParameter
import cz.vokounova.configurator.shared.skp.SkpParameterExtractor
import cz.vokounova.configurator.users.api.dto.UserIdDto
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import java.math.BigDecimal
import java.nio.file.Files
import java.nio.file.Paths
import java.util.UUID

/**
 * Orchestrates import of a product from SketchUp (.skp) and GLB files.
 * Extracts parameters from SKP, creates product model, components, attributes, options,
 * stores the GLB, and sets model_3d_url.
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
    fun importFromSketchUp(
        skpFile: MultipartFile,
        glbFile: MultipartFile,
        userId: UserIdDto,
        productName: String? = null,
    ): SkpImportResult {
        val skpResult = SkpParameterExtractor.extractParametersFromBytes(skpFile.bytes)
        if (!skpResult.isSuccess) {
            return SkpImportResult(success = false, productModelId = null, error = skpResult.error)
        }

        val name = productName ?: skpFile.originalFilename?.removeSuffix(".skp") ?: "Imported Product"
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
        createAttributeOptions(
            attributes,
            skpResult.materialColors,
            materialTextureUrls,
            productModel.id,
        )

        val model3dUrl = storeGlb(glbFile)
        if (model3dUrl != null) {
            productModelAPI.patch(
                productModel.id,
                listOf(
                    ProductModelJsonPatchParams(
                        path = ProductModelJsonPatchParamsPath.MODEL_3D_URL,
                        value = model3dUrl,
                        op = JsonPatchOperation.REPLACE,
                    ),
                ),
            )
        }

        return SkpImportResult(
            success = true,
            productModelId = productModel.id.value,
            error = null,
        )
    }

    /**
     * Keeps only merchant-relevant params for pricing and config.
     * Convention: color_X, diameter_X, thickness_X, diameter, thickness, leg_count, lenx/y/z.
     * Skips internal SketchUp DC params.
     */
    private fun filterMerchantRelevantParams(params: List<SkpParameter>): List<SkpParameter> {
        val hasDiameter = params.any { it.name == "diameter" } || params.any { it.name.startsWith("diameter_") }
        return params.filter { param ->
            val n = param.name.lowercase()
            if (n in INTERNAL_SKP_PARAMS) return@filter false
            when {
                n.startsWith("color") -> true
                n == "diameter" || n.startsWith("diameter_") -> true
                n == "thickness" || n.startsWith("thickness_") -> true
                n.contains("count") || n.contains("leg") || n.contains("visibility") -> true
                n in listOf("lenx", "leny", "lenz") -> !hasDiameter
                else -> false
            }
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

        val DEFAULT_COLOR_OPTIONS: List<Pair<String, String>> =
            listOf(
                "oak" to "#C49A6C",
                "black" to "#1A1A1A",
                "white" to "#F5F5F5",
                "walnut" to "#5C4033",
                "ash" to "#DEB887",
            )

        /** Maps material names (from SketchUp options) to hex. Used when options are extracted from SKP. */
        private val MATERIAL_NAME_TO_HEX: Map<String, String> =
            buildMap {
                DEFAULT_COLOR_OPTIONS.forEach { (name, hex) ->
                    put(name, hex)
                    put(name.lowercase(), hex)
                    put(name.replace(" ", ""), hex)
                }
                listOf("oak2" to "#C49A6C", "black2" to "#1A1A1A").forEach { (name, hex) ->
                    put(name, hex)
                    put(name.lowercase(), hex)
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
            val (type, minDecimal, maxDecimal, minInt, maxInt) = inferAttributeType(param)
            val attribute =
                attributeAPI.create(
                    AttributeCreateParams(
                        componentId = component.id,
                        code = param.name.uppercase().replace(Regex("[^A-Z0-9_]"), "_"),
                        label = param.label.ifEmpty { param.name },
                        type = type,
                        isRequired = false,
                        minInt = minInt,
                        maxInt = maxInt,
                        minDecimal = minDecimal,
                        maxDecimal = maxDecimal,
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
                attribute.minInt != null && attribute.maxInt != null && type == AttributeType.INTEGER ->
                    defaultPricingRulesService.createDefaultsForNumericAttributeIfEmpty(
                        productModelId.value,
                        component.id.value,
                        attribute.code,
                        attribute.minInt.toString(),
                        attribute.maxInt.toString(),
                    )
                attribute.minDecimal != null && attribute.maxDecimal != null && type == AttributeType.DECIMAL ->
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

    private fun inferAttributeType(param: SkpParameter): AttributeTypeInference =
        when {
            param.name.startsWith("color") ->
                AttributeTypeInference(AttributeType.ENUM, null, null, null, null)
            param.name.contains("count") || param.name.contains("leg") ->
                AttributeTypeInference(AttributeType.INTEGER, null, null, 1, 10)
            param.name.contains("diameter") || param.name.contains("thickness") || param.name.contains("len") ->
                AttributeTypeInference(AttributeType.INTEGER, null, null, 1, 5000)
            else ->
                AttributeTypeInference(
                    AttributeType.DECIMAL,
                    BigDecimal("1"),
                    BigDecimal("5000"),
                    null,
                    null,
                )
        }

    private fun createAttributeOptions(
        attributesWithParams: List<Pair<Attribute, SkpParameter>>,
        materialColors: Map<String, String> = emptyMap(),
        materialTextureUrls: Map<String, String> = emptyMap(),
        productModelId: ProductModelId,
    ) {
        attributesWithParams.forEach { (attribute, param) ->
            if (attribute.type == AttributeType.ENUM) {
                val optionNames =
                    param.options.ifEmpty { DEFAULT_COLOR_OPTIONS.map { it.first } }
                optionNames.forEachIndexed { idx, name ->
                    val colorHex =
                        materialColors[name]
                            ?: materialColors[name.lowercase()]
                            ?: MATERIAL_NAME_TO_HEX[name]
                            ?: MATERIAL_NAME_TO_HEX[name.lowercase()]
                    val textureUrl =
                        materialTextureUrls[name] ?: materialTextureUrls[name.lowercase()]
                    val optionValue = name.uppercase().replace(Regex("[^A-Z0-9]"), "_")
                    attributeOptionAPI.create(
                        AttributeOptionCreateParams(
                            attributeId = attribute.id,
                            value = optionValue,
                            label = name.replaceFirstChar { it.uppercase() },
                            imageUrl = textureUrl,
                            colorHex = colorHex,
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

    private fun storeMaterialTextures(materialTextures: Map<String, Pair<ByteArray, String>>): Map<String, String> {
        if (materialTextures.isEmpty()) return emptyMap()
        val uploadPath = Paths.get(uploadDir)
        Files.createDirectories(uploadPath)
        return materialTextures.mapValues { (_, pair) ->
            val (bytes, ext) = pair
            val uniqueFilename = "${UUID.randomUUID()}.$ext"
            val filePath = uploadPath.resolve(uniqueFilename)
            Files.write(filePath, bytes)
            "/api/v1/files/$uniqueFilename"
        }
    }

    private fun storeGlb(glbFile: MultipartFile): String? {
        if (glbFile.isEmpty) return null
        val originalFilename = glbFile.originalFilename ?: ""
        if (!originalFilename.lowercase().endsWith(".glb")) return null
        val uploadPath = Paths.get(uploadDir)
        Files.createDirectories(uploadPath)
        val uniqueFilename = "${UUID.randomUUID()}.glb"
        val filePath = uploadPath.resolve(uniqueFilename)
        Files.write(filePath, glbFile.bytes)
        return "/api/v1/files/$uniqueFilename"
    }
}

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

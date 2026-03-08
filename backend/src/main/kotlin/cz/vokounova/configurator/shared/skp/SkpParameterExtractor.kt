package cz.vokounova.configurator.shared.skp

import java.io.ByteArrayInputStream
import java.nio.charset.Charset
import java.nio.file.Files
import java.nio.file.Path
import java.util.regex.Pattern
import java.util.zip.ZipInputStream

/**
 * Heuristic extractor of Dynamic Component parameters from SketchUp .skp files.
 *
 * SKP files are ZIP archives containing model.dat (binary). The binary format is proprietary,
 * but parameter names and metadata appear as readable strings. This extractor scans for known
 * Dynamic Component patterns and returns what it finds.
 *
 * Limitations:
 * - Min/max/default values may not be reliably extracted (binary format)
 * - Only discovers parameters that follow SketchUp DC naming (prumer, lenx, leny, lenz, etc.)
 * - User should configure min/max in the app's attribute setup
 */
object SkpParameterExtractor {
    private const val MODEL_DAT = "model.dat"

    private val PARAM_METADATA_SUFFIXES =
        listOf(
            "_label",
            "_units",
            "_formulaunits",
            "_formlabel",
            "_options",
            "_access",
        )

    /**
     * Extracts Dynamic Component parameters from an SKP file.
     * @param skpPath path to the .skp file
     * @return extracted parameters, or empty list if extraction fails
     */
    fun extractParameters(skpPath: Path): SkpParameterExtractionResult =
        try {
            val bytes = Files.readAllBytes(skpPath)
            extractParametersFromBytes(bytes)
        } catch (e: Exception) {
            SkpParameterExtractionResult(error = "Failed to read SKP: ${e.message}")
        }

    /**
     * Extracts parameters from SKP bytes (e.g. from uploaded file).
     */
    fun extractParametersFromBytes(skpBytes: ByteArray): SkpParameterExtractionResult {
        return try {
            val zip =
                extractFromZip(skpBytes)
                    ?: return SkpParameterExtractionResult(
                        error = "No model.dat in SKP",
                    )
            parseModelDat(
                zip.modelDat,
                zip.components,
                zip.materials,
                zip.materialColors,
                zip.materialTextures,
            )
        } catch (e: Exception) {
            SkpParameterExtractionResult(error = "Failed to parse SKP: ${e.message}")
        }
    }

    private fun extractFromZip(skpBytes: ByteArray): ZipExtraction? {
        val zipStart = findZipOffset(skpBytes)
        val zipInputStream =
            ZipInputStream(
                ByteArrayInputStream(skpBytes, zipStart, skpBytes.size - zipStart),
            )
        var modelDat: ByteArray? = null
        val components = mutableListOf<String>()
        val materials = mutableListOf<String>()
        val materialColors = mutableMapOf<String, String>()
        val materialTextures = mutableMapOf<String, Pair<ByteArray, String>>()
        zipInputStream.use { zis ->
            var entry = zis.nextEntry
            while (entry != null) {
                when {
                    entry.name == MODEL_DAT -> modelDat = zis.readBytes()
                    entry.name.startsWith("thumbnails/") &&
                        (entry.name.endsWith(".png") || entry.name.endsWith(".jpg")) -> {
                        val name =
                            entry.name
                                .removePrefix("thumbnails/")
                                .removeSuffix(".png")
                                .removeSuffix(".jpg")
                        val baseName = name.replace(Regex("#\\d+$"), "")
                        if (baseName !in components) components.add(baseName)
                    }
                    entry.name.endsWith("/material.xml") && entry.name.startsWith("materials/") -> {
                        val matName = entry.name.removePrefix("materials/").substringBefore('/')
                        if (!matName.startsWith("Layer_")) {
                            if (matName !in materials) materials.add(matName)
                            parseMaterialColor(zis.readBytes())?.let { hex ->
                                materialColors[matName] = hex
                            }
                        }
                        entry = zis.nextEntry
                        continue
                    }
                    entry.name.startsWith("materials/") &&
                        entry.name.count { it == '/' } == 2 &&
                        (entry.name.endsWith(".jpg") || entry.name.endsWith(".png")) -> {
                        val matName = entry.name.removePrefix("materials/").substringBefore('/')
                        val fileName = entry.name.substringAfterLast('/')
                        if (!matName.startsWith("Layer_")) {
                            if (matName !in materials) materials.add(matName)
                            if (fileName.lowercase() !in listOf("thumbnail.jpg", "thumbnail.png")) {
                                val bytes = zis.readBytes()
                                val ext = if (entry.name.endsWith(".png")) "png" else "jpg"
                                val current = materialTextures[matName]
                                if (current == null || bytes.size > current.first.size) {
                                    materialTextures[matName] = bytes to ext
                                }
                            }
                        }
                        entry = zis.nextEntry
                        continue
                    }
                    entry.name.startsWith("materials/") && entry.name.count { it == '/' } == 2 -> {
                        val matName = entry.name.removePrefix("materials/").substringBefore('/')
                        if (matName !in materials && !matName.startsWith("Layer_")) {
                            materials.add(matName)
                        }
                    }
                }
                entry = zis.nextEntry
            }
        }
        return modelDat?.let {
            ZipExtraction(
                it,
                components.distinct(),
                materials.distinct(),
                materialColors,
                materialTextures,
            )
        }
    }

    /** Parses SketchUp material.xml for colorRed, colorGreen, colorBlue (0-255) and returns hex. */
    private fun parseMaterialColor(xmlBytes: ByteArray): String? {
        val text = String(xmlBytes, Charset.forName("UTF-8"))
        val r =
            Regex("colorRed=\"(\\d+)\"")
                .find(text)
                ?.groupValues
                ?.get(1)
                ?.toIntOrNull() ?: return null
        val g =
            Regex("colorGreen=\"(\\d+)\"")
                .find(text)
                ?.groupValues
                ?.get(1)
                ?.toIntOrNull() ?: return null
        val b =
            Regex("colorBlue=\"(\\d+)\"")
                .find(text)
                ?.groupValues
                ?.get(1)
                ?.toIntOrNull() ?: return null
        return "#%02X%02X%02X".format(r.coerceIn(0, 255), g.coerceIn(0, 255), b.coerceIn(0, 255))
    }

    private data class ZipExtraction(
        val modelDat: ByteArray,
        val components: List<String>,
        val materials: List<String>,
        val materialColors: Map<String, String> = emptyMap(),
        val materialTextures: Map<String, Pair<ByteArray, String>> = emptyMap(),
    )

    private fun findZipOffset(bytes: ByteArray): Int {
        val pk = byteArrayOf(0x50, 0x4b, 0x03, 0x04)
        for (i in 0..(bytes.size - 4)) {
            if (bytes[i] == pk[0] && bytes[i + 1] == pk[1] && bytes[i + 2] == pk[2] && bytes[i + 3] == pk[3]) {
                return i
            }
        }
        return 0
    }

    private fun parseModelDat(
        bytes: ByteArray,
        components: List<String>,
        materials: List<String>,
        materialColors: Map<String, String> = emptyMap(),
        materialTextures: Map<String, Pair<ByteArray, String>> = emptyMap(),
    ): SkpParameterExtractionResult {
        val text = decodeWithReplacements(bytes)
        if (!text.contains("dynamic_attributes")) {
            val root =
                components.find { it.equals("table", ignoreCase = true) }
                    ?: components.firstOrNull()
                    ?: "Default"
            return SkpParameterExtractionResult(
                parameters = emptyList(),
                rootComponent = root,
                meshNames = components,
                materials = materials,
                materialColors = materialColors,
                materialTextures = materialTextures,
                error = "No dynamic_attributes found (model may not use Dynamic Components)",
            )
        }

        val params = mutableMapOf<String, MutableMap<String, String>>()

        for (suffix in PARAM_METADATA_SUFFIXES) {
            val escaped = Pattern.quote(suffix)
            val pattern = Pattern.compile("_([a-z0-9_]+)$escaped[^a-zA-Z0-9_]*(?:[^a-zA-Z0-9]*([A-Za-z0-9_,\\s|;.\\-]+))?")
            val matcher = pattern.matcher(text)
            while (matcher.find()) {
                val paramName = matcher.group(1) ?: continue
                if (paramName.startsWith("_")) continue
                val value = (matcher.group(2) ?: "").trim()
                params.getOrPut(paramName) { mutableMapOf() }[suffix.drop(1)] =
                    value
            }
        }

        val paramNames = extractParamNames(text)
        val paramOptions = extractParamOptions(text)
        val result =
            paramNames
                .mapNotNull { name ->
                    val meta = params[name] ?: emptyMap()
                    val rawUnit = meta["formulaunits"] ?: meta["units"] ?: ""
                    val unit = sanitizeUnit(rawUnit, name)
                    val rawLabel = meta["formlabel"] ?: meta["label"] ?: name
                    val label = sanitizeLabel(rawLabel, name)
                    val options =
                        when {
                            (name.startsWith("color") || name.endsWith("_color")) &&
                                paramOptions[name].isNullOrEmpty() -> materials
                            else -> paramOptions[name] ?: parseOptionsFromMeta(meta["options"])
                        }
                    SkpParameter(
                        name = name,
                        label = label,
                        unit = unit,
                        options = options,
                    )
                }.distinctBy { it.name }

        val rootComponent =
            components.find { it.equals("table", ignoreCase = true) }
                ?: components.firstOrNull()
                ?: "Default"
        return SkpParameterExtractionResult(
            parameters = result,
            rootComponent = rootComponent,
            meshNames = components,
            materials = materials,
            materialColors = materialColors,
            materialTextures = materialTextures,
        )
    }

    private fun extractParamOptions(text: String): Map<String, List<String>> {
        val result = mutableMapOf<String, List<String>>()
        val pattern =
            Pattern.compile(
                "_([a-z0-9_]+)_options[^a-zA-Z0-9]*([A-Za-z0-9_,.\\s|;]+?)(?=\\s_[a-z0-9]+_|\\s*$)",
            )
        val matcher = pattern.matcher(text)
        while (matcher.find()) {
            val paramName = matcher.group(1) ?: continue
            if (paramName.startsWith("_")) continue
            val value = matcher.group(2)?.trim() ?: ""
            val options = parseOptionsString(value)
            if (options.isNotEmpty()) {
                result[paramName] = options
            }
        }
        return result
    }

    private fun parseOptionsFromMeta(metaValue: String?): List<String> {
        if (metaValue.isNullOrBlank()) return emptyList()
        return parseOptionsString(metaValue.trim())
    }

    private fun parseOptionsString(value: String): List<String> {
        if (value.isBlank()) return emptyList()
        return value
            .split(Regex("[,|;\\s]+"))
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .distinct()
    }

    /**
     * Rejects garbage units (e.g. "8" from binary) and returns sensible default for dimensions.
     * Supports mm, cm, m, in. For dimension params, defaults to "mm" when unit is invalid.
     */
    private fun sanitizeUnit(
        raw: String,
        paramName: String,
    ): String {
        val trimmed = raw.trim()
        if (trimmed.isEmpty()) return ""
        if (Regex("^\\d+$").matches(trimmed)) return ""
        val validUnits = setOf("mm", "cm", "m", "in", "inch", "ft", "CENTIMETERS", "INCHES", "MM")
        if (trimmed.uppercase() in validUnits.map { it.uppercase() }) {
            return when (trimmed.uppercase()) {
                "MM" -> "mm"
                "CM", "CENTIMETERS" -> "cm"
                "M" -> "m"
                "IN", "INCHES", "INCH" -> "in"
                "FT" -> "ft"
                else -> trimmed
            }
        }
        if (
            paramName.contains("diameter") ||
            paramName.contains("thickness") ||
            paramName.contains("len") ||
            paramName in setOf("width", "depth", "height", "sirka", "hloubka", "vyska")
        ) {
            return "mm"
        }
        return ""
    }

    /**
     * Rejects garbage labels (e.g. "8" from binary) and uses parameter name as fallback.
     */
    private fun sanitizeLabel(
        raw: String,
        paramName: String,
    ): String {
        val trimmed = raw.trim()
        if (trimmed.isEmpty()) return paramName
        if (Regex("^\\d+$").matches(trimmed)) return paramName
        if (trimmed.length == 1 && trimmed[0].isDigit()) return paramName
        return trimmed
    }

    private fun extractParamNames(text: String): List<String> {
        val found = mutableSetOf<String>()
        // Universal dimension params: diameter/thickness, X_thickness, width, depth, height, etc.
        val dimensionParams =
            Pattern.compile(
                "(?<![a-zA-Z0-9_])" +
                    "(diameter_[a-z0-9_]+|diameter|thickness_[a-z0-9_]+|[a-z0-9_]+_thickness|thickness|" +
                    "width|depth|height|sirka|hloubka|vyska|lenx|leny|lenz|prumer|tloustka)" +
                    "(?![a-zA-Z0-9_])",
            )
        val matcher = dimensionParams.matcher(text)
        while (matcher.find()) {
            found.add(matcher.group(1)!!.lowercase())
        }
        // color_X, X_color, barva_X, and any param with _label, _units, etc.
        val underscorePattern =
            Pattern.compile("_([a-z][a-z0-9_]+?)_(?:label|units|formulaunits|formlabel|options)")
        val colorSuffixPattern = Pattern.compile("(?<![a-zA-Z0-9_])([a-z0-9_]+_color)(?![a-zA-Z0-9_])")
        val colorMatcher = colorSuffixPattern.matcher(text)
        while (colorMatcher.find()) {
            found.add(colorMatcher.group(1)!!.lowercase())
        }
        val matcher2 = underscorePattern.matcher(text)
        while (matcher2.find()) {
            val name = matcher2.group(1)
            if (name != null && !name.startsWith("_")) {
                found.add(name)
            }
        }
        return found.toList()
    }

    private fun decodeWithReplacements(bytes: ByteArray): String = String(bytes, Charset.forName("ISO-8859-1"))
}

/** Effect of a parameter on a mesh node (from SketchUp plugin parameters.json). */
data class SkpParameterEffect(
    val meshNode: String,
    val type: String,
    val axis: String? = null,
    val multiplier: Double? = null,
    /** Param to subtract from value (e.g. LenY in (parent!height-LenY)/2). */
    val subtractParam: String? = null,
    /** Constant offset in cm (e.g. -1 inch → -2.54 in parent!width-LenX-1). */
    val offsetCm: Double? = null,
)

data class SkpParameter(
    val name: String,
    val label: String,
    val unit: String,
    /** Inferred target mesh/component (e.g. Deska, Podnozi). Empty if unknown. */
    val targetComponent: String? = null,
    /** Inferred effect: scale, material, visibility. Empty if unknown. */
    val effect: String? = null,
    /** Option values for ENUM params (e.g. color_TOP → ["oak","black","white"]). From _options metadata. */
    val options: List<String> = emptyList(),
    /** Effects from parameters.json: one param can affect multiple mesh nodes. */
    val effects: List<SkpParameterEffect> = emptyList(),
    /** Default from SketchUp (parameters.json). Used for 3D preview initial state. */
    val defaultDouble: Double? = null,
    val minDouble: Double? = null,
    val maxDouble: Double? = null,
)

data class SkpParameterExtractionResult(
    val parameters: List<SkpParameter> = emptyList(),
    /** Root component name (the DC that has the attributes, e.g. "table"). Single component for config UI. */
    val rootComponent: String = "Default",
    /** Mesh/group names from thumbnails (for 3D: color_top → "top", color_legs → "legs"). */
    val meshNames: List<String> = emptyList(),
    /** Material names from materials/ in SKP zip (used as color options). */
    val materials: List<String> = emptyList(),
    /** Material name → hex color from SketchUp material.xml (colorRed, colorGreen, colorBlue). */
    val materialColors: Map<String, String> = emptyMap(),
    /** Material name → (texture bytes, extension) for PNG/JPG textures. */
    val materialTextures: Map<String, Pair<ByteArray, String>> = emptyMap(),
    /** Attribute code → effects (from parameters.json). Used by ModelViewer3D for one-to-many mapping. */
    val model3dEffects: Map<String, List<SkpParameterEffect>> = emptyMap(),
    /**
     * Per-component transforms: meshName → { x, y, z, lenx, leny, lenz, material, ... }.
     * Each value is either a number (cm) or a formula string like "=(parent!height-LenY)/2".
     */
    val componentTransforms: Map<String, Map<String, Any?>> = emptyMap(),
    /**
     * Attribute code → default value for formula resolution when config is not yet loaded.
     * Keys match attribute codes (e.g. WIDTH, HEIGHT).
     */
    val parameterDefaults: Map<String, Double> = emptyMap(),
    val error: String? = null,
) {
    val isSuccess: Boolean get() = error == null
}

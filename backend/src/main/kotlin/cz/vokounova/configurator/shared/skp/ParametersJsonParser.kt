package cz.vokounova.configurator.shared.skp

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper

/**
 * Parses parameters.json from the SketchUp Configurator DC Export plugin.
 * Supports one parameter affecting multiple mesh nodes via effects array.
 */
object ParametersJsonParser {
    private val objectMapper = ObjectMapper()

    /**
     * @param materialTexturesFromZip path -> (bytes, ext) for texture files extracted from zip.
     *   Keys match texturePath in materials (e.g. "materials/oak.png").
     */
    fun parse(
        jsonBytes: ByteArray,
        materialTexturesFromZip: Map<String, Pair<ByteArray, String>> = emptyMap(),
    ): SkpParameterExtractionResult =
        try {
            val root = objectMapper.readTree(jsonBytes)
            val parametersNode = root["parameters"]
            val componentsNode = root["components"]

            if (parametersNode == null || !parametersNode.isArray) {
                SkpParameterExtractionResult(error = "Invalid parameters.json: missing or invalid 'parameters' array")
            } else {
                val parameters = parametersNode.mapNotNull { parseParameter(it) }
                val components =
                    componentsNode
                        ?.takeIf { it.isArray }
                        ?.map { it.asText().trim() }
                        ?.filter { it.isNotEmpty() }
                        ?.distinct()
                        ?: parameters.flatMap { p -> p.effects.map { it.meshNode } }.distinct()

                val rootComponent =
                    components.find { it.equals("table", ignoreCase = true) }
                        ?: components.firstOrNull()
                        ?: "Default"

                val (materialColors, materialTextures) = parseMaterials(root, materialTexturesFromZip)
                val componentTransforms = parseComponentTransforms(root)
                val parameterDefaults = buildParameterDefaults(parameters)

                SkpParameterExtractionResult(
                    parameters = parameters,
                    rootComponent = rootComponent,
                    meshNames = components,
                    materials = emptyList(),
                    materialColors = materialColors,
                    materialTextures = materialTextures,
                    model3dEffects = buildEffectsMap(parameters),
                    componentTransforms = componentTransforms,
                    parameterDefaults = parameterDefaults,
                )
            }
        } catch (e: Exception) {
            SkpParameterExtractionResult(error = "Failed to parse parameters.json: ${e.message}")
        }

    private fun parseParameter(node: JsonNode): SkpParameter? {
        val name = node["name"]?.asText()?.trim() ?: return null
        val label = node["label"]?.asText()?.trim() ?: name
        val unit = node["unit"]?.asText()?.trim() ?: ""
        val defaultVal = parseOptionalDouble(node["default"])
        val minVal = parseOptionalDouble(node["min"])
        val maxVal = parseOptionalDouble(node["max"])

        val options = parseOptions(node["options"])

        val effects = parseEffects(node["effects"])

        val targetComponent = effects.firstOrNull()?.meshNode
        val effect = effects.firstOrNull()?.type

        return SkpParameter(
            name = name,
            label = label,
            unit = unit,
            targetComponent = targetComponent,
            effect = effect,
            options = options,
            effects = effects,
            defaultDouble = defaultVal,
            minDouble = minVal,
            maxDouble = maxVal,
        )
    }

    private fun parseEffects(node: JsonNode?): List<SkpParameterEffect> {
        if (node == null || !node.isArray) return emptyList()
        return node.mapNotNull { e ->
            val meshNode = e["meshNode"]?.asText()?.trim() ?: return@mapNotNull null
            val type = e["type"]?.asText()?.trim() ?: return@mapNotNull null
            val axis = e["axis"]?.asText()?.trim()
            val multiplier = e["multiplier"]?.asDouble()
            val subtractParam = e["subtractParam"]?.asText()?.trim()?.takeIf { it.isNotEmpty() }
            val offsetCm = e["offsetCm"]?.asDouble()
            SkpParameterEffect(
                meshNode = meshNode,
                type = type,
                axis = axis,
                multiplier = multiplier,
                subtractParam = subtractParam,
                offsetCm = offsetCm,
            )
        }
    }

    /** Parses a numeric JSON value; returns null for null, missing, or non-numeric nodes. */
    private fun parseOptionalDouble(node: JsonNode?): Double? =
        when {
            node == null || node.isNull -> null
            node.isNumber -> node.asDouble()
            else -> null
        }

    private fun parseOptions(node: JsonNode?): List<String> {
        if (node == null || !node.isArray) return emptyList()
        return node.mapNotNull { opt ->
            when {
                opt.isTextual -> opt.asText().trim().takeIf { it.isNotEmpty() }
                opt.isObject -> opt["value"]?.asText()?.trim()?.takeIf { it.isNotEmpty() }
                else -> null
            }
        }
    }

    /**
     * Parses materials from parameters.json. Only textures are supported (no colorHex).
     * materials: { "oak": { "texturePath": "materials/oak.png" }, ... }
     */
    fun parseMaterials(
        root: JsonNode,
        materialTexturesFromZip: Map<String, Pair<ByteArray, String>>,
    ): Pair<Map<String, String>, Map<String, Pair<ByteArray, String>>> {
        val textures = mutableMapOf<String, Pair<ByteArray, String>>()

        val materialsNode = root["materials"]
        if (materialsNode != null && materialsNode.isObject) {
            materialsNode.fields().forEach { (matName, matNode) ->
                if (!matNode.isObject) return@forEach
                val texturePath = matNode["texturePath"]?.asText()?.trim()?.takeIf { it.isNotEmpty() }
                if (texturePath != null) {
                    val pair =
                        materialTexturesFromZip[texturePath]
                            ?: materialTexturesFromZip.entries
                                .find { (k, _) -> k.equals(texturePath, ignoreCase = true) }
                                ?.value
                    if (pair != null) textures[matName] = pair
                }
            }
        }

        return emptyMap<String, String>() to textures
    }

    private fun buildEffectsMap(parameters: List<SkpParameter>): Map<String, List<SkpParameterEffect>> =
        parameters
            .filter { it.effects.isNotEmpty() }
            .associate { param ->
                param.name.uppercase().replace(Regex("[^A-Z0-9_]"), "_") to param.effects
            }

    private fun buildParameterDefaults(parameters: List<SkpParameter>): Map<String, Double> =
        parameters
            .filter { it.defaultDouble != null }
            .associate { param ->
                param.name.uppercase().replace(Regex("[^A-Z0-9_]"), "_") to param.defaultDouble!!
            }

    /**
     * Parses componentTransforms: meshName → { x, y, z, lenx, leny, lenz, material, ... }.
     * Each value is either a number (cm) or a formula string.
     */
    private fun parseComponentTransforms(root: JsonNode): Map<String, Map<String, Any?>> {
        val node = root["componentTransforms"] ?: return emptyMap()
        if (!node.isObject) return emptyMap()
        val result = mutableMapOf<String, Map<String, Any?>>()
        node.fields().forEach { (meshName, compNode) ->
            if (!compNode.isObject) return@forEach
            val compMap = mutableMapOf<String, Any?>()
            compNode.fields().forEach { (key, valueNode) ->
                compMap[key] =
                    when {
                        valueNode.isNumber -> valueNode.asDouble()
                        valueNode.isTextual -> valueNode.asText()
                        valueNode.isNull -> null
                        else -> valueNode.asText()
                    }
            }
            if (compMap.isNotEmpty()) result[meshName.trim()] = compMap
        }
        return result
    }
}

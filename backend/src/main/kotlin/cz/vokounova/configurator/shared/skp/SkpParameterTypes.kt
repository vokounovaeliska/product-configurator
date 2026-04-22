package cz.vokounova.configurator.shared.skp

data class SkpParameterEffect(
    val meshNode: String,
    val type: String,
    val axis: String? = null,
    val multiplier: Double? = null,
    val subtractParam: String? = null,
    val offsetCm: Double? = null,
)

data class SkpParameter(
    val name: String,
    val label: String,
    val unit: String,
    val targetComponent: String? = null,
    val effect: String? = null,
    val options: List<String> = emptyList(),
    val effects: List<SkpParameterEffect> = emptyList(),
    val defaultDouble: Double? = null,
    val minDouble: Double? = null,
    val maxDouble: Double? = null,
)

data class SkpParameterExtractionResult(
    val parameters: List<SkpParameter> = emptyList(),
    val rootComponent: String = "Default",
    val meshNames: List<String> = emptyList(),
    val materials: List<String> = emptyList(),
    val materialColors: Map<String, String> = emptyMap(),
    val materialTextures: Map<String, Pair<ByteArray, String>> = emptyMap(),
    val model3dEffects: Map<String, List<SkpParameterEffect>> = emptyMap(),
    val componentTransforms: Map<String, Map<String, Any?>> = emptyMap(),
    val parameterDefaults: Map<String, Double> = emptyMap(),
    val error: String? = null,
) {
    val isSuccess: Boolean get() = error == null
}

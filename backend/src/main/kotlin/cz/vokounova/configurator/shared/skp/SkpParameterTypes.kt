package cz.vokounova.configurator.shared.skp

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

package cz.vokounova.configurator.shared.jsonpatch

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.github.fge.jsonpatch.JsonPatch
import cz.vokounova.configurator.shared.exceptions.InvalidJsonPatchException
import cz.vokounova.configurator.shared.utils.logger
import org.springframework.stereotype.Component

@Component
class JsonPatchUtils(
    val objectMapper: ObjectMapper,
) {
    companion object {
        private val LOG by logger()
    }

    /**
     * Applies and maps json patch to type [T]
     *
     * @param params json patch params [P]
     * @param instance instance of type [T] to apply json patch on
     *
     * @return instance of object [T]
     */
    final inline fun <reified P, reified T> applyAndMapJsonPatch(
        params: P,
        instance: T,
    ): T {
        val jsonPatch = convertToJsonPatch(params)
        val appliedPatch = applyJsonPatch(jsonPatch, instance)
        return objectMapper.treeToValue(appliedPatch, T::class.java)
    }

    /**
     * Applies json patch from request to domain object [T]
     *
     * @param patch Json patch from request
     * @param target Domain object class
     *
     * @return [JsonNode] for json patch
     */
    final fun <T> applyJsonPatch(
        patch: JsonPatch,
        target: T,
    ): JsonNode = patch.apply(objectMapper.convertValue(target, JsonNode::class.java))

    /**
     * Converts value to json patch and validates json patch
     *
     * @param obj object of type [T]
     *
     */
    final fun <T> convertToJsonPatch(obj: T): JsonPatch =
        try {
            JsonPatch.fromJson(objectMapper.valueToTree(obj))
        } catch (e: Exception) {
            LOG.error("Error occurred while converting to Json patch", e)
            throw InvalidJsonPatchException("Invalid JSON Patch")
        }
}

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

    final inline fun <reified P, reified T> applyAndMapJsonPatch(
        params: P,
        instance: T,
    ): T {
        val jsonPatch = convertToJsonPatch(params)
        val appliedPatch = applyJsonPatch(jsonPatch, instance)
        return objectMapper.treeToValue(appliedPatch, T::class.java)
    }

    final fun <T> applyJsonPatch(
        patch: JsonPatch,
        target: T,
    ): JsonNode = patch.apply(objectMapper.convertValue(target, JsonNode::class.java))

    final fun <T> convertToJsonPatch(obj: T): JsonPatch =
        try {
            JsonPatch.fromJson(objectMapper.valueToTree(obj))
        } catch (e: Exception) {
            LOG.error("Error occurred while converting to Json patch", e)
            throw InvalidJsonPatchException("Invalid JSON Patch")
        }
}

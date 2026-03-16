package cz.vokounova.configurator.customerrequest.application

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.node.ObjectNode
import cz.vokounova.configurator.products.api.dto.FullProductConfigDto

/**
 * Extracts user choices from configurationJson for display in emails.
 * When productConfig is provided, formats as "Attribute: value" (attribute label only).
 * Otherwise uses option.label when available; falls back to value.
 */
object ConfigurationChoiceFormatter {
    data class ChoiceItem(val displayValue: String)

    fun extractChoices(
        configurationJson: JsonNode?,
        productConfig: FullProductConfigDto? = null,
    ): List<ChoiceItem> {
        if (configurationJson == null || !configurationJson.isObject) return emptyList()
        val obj = configurationJson as ObjectNode
        val items = mutableListOf<ChoiceItem>()

        val attrsByComp = productConfig?.attributesByComponent ?: emptyMap()

        val opts = obj.get("selectedOptionsByComponent")
        if (opts != null && opts.isObject) {
            for (compEntry in opts.fields()) {
                val compId = compEntry.key
                val comp = compEntry.value
                if (comp == null || !comp.isObject) continue
                val attrs = attrsByComp[compId] ?: emptyList()
                val attrMap = attrs.associateBy { it.id.toString() }

                for (attrEntry in comp.fields()) {
                    val attrId = attrEntry.key
                    val opt = attrEntry.value
                    if (opt == null || opt.isNull) continue
                    val valueDisplay =
                        when {
                            opt.isObject && opt.has("label") && !opt.get("label").isNull ->
                                opt.get("label").asText().takeIf { it.isNotBlank() }
                            opt.isObject && opt.has("value") && !opt.get("value").isNull ->
                                opt.get("value").asText().takeIf { it.isNotBlank() }
                            opt.isTextual -> opt.asText().takeIf { it.isNotBlank() }
                            else -> null
                        }
                    if (valueDisplay == null) continue
                    val attrLabel = attrMap[attrId]?.label ?: attrMap[attrId]?.code
                    val display =
                        when {
                            attrLabel != null -> "$attrLabel: $valueDisplay"
                            else -> valueDisplay
                        }
                    items.add(ChoiceItem(displayValue = display))
                }
            }
        }

        val other = obj.get("selectedOtherValuesByComponent")
        if (other != null && other.isObject) {
            for (compEntry in other.fields()) {
                val compId = compEntry.key
                val comp = compEntry.value
                if (comp == null || !comp.isObject) continue
                val attrs = attrsByComp[compId] ?: emptyList()
                val attrMap = attrs.associateBy { it.id.toString() }

                for (attrEntry in comp.fields()) {
                    val attrId = attrEntry.key
                    val v = attrEntry.value
                    if (v == null || v.isNull) continue
                    val valueDisplay =
                        when {
                            v.isBoolean -> if (v.asBoolean()) "Yes" else "No"
                            v.isNumber -> v.asText()
                            else -> v.asText().takeIf { it.isNotBlank() }
                        }
                    if (valueDisplay == null) continue
                    val attr = attrMap[attrId]
                    val attrLabel = attr?.label ?: attr?.code
                    val unit = attr?.unit
                    val valueWithUnit =
                        if (unit != null && v.isNumber) "$valueDisplay $unit" else valueDisplay
                    val display =
                        when {
                            attrLabel != null -> "$attrLabel: $valueWithUnit"
                            else -> valueWithUnit
                        }
                    items.add(ChoiceItem(displayValue = display))
                }
            }
        }

        return items
    }
}

package cz.vokounova.configurator.products.attributes.application.validation

import cz.vokounova.configurator.generated.jooq.enums.AttributeType
import cz.vokounova.configurator.products.attributes.application.exception.AttributeErrorCode
import cz.vokounova.configurator.products.attributes.application.exception.AttributeException
import cz.vokounova.configurator.products.attributes.domain.Attribute
import org.springframework.stereotype.Component

@Component
class AttributeDomainValidator {
    fun validate(attribute: Attribute) {
        when (attribute.type) {
            AttributeType.ENUM -> {
                // ENUM attributes should not have numeric fields
                if (attribute.minInt != null || attribute.maxInt != null || attribute.minDecimal != null || attribute.maxDecimal != null ||
                    attribute.defaultInt != null || attribute.defaultDecimal != null
                ) {
                    throw AttributeException(AttributeErrorCode.INVALID_ATTRIBUTE_TYPE_CONFIGURATION)
                }
            }
            AttributeType.INTEGER -> {
                // INTEGER attributes should have min/max int, not decimal
                if (attribute.minDecimal != null || attribute.maxDecimal != null) {
                    throw AttributeException(AttributeErrorCode.INVALID_ATTRIBUTE_TYPE_CONFIGURATION)
                }
                // Validate range
                if (attribute.minInt != null && attribute.maxInt != null && attribute.minInt > attribute.maxInt) {
                    throw AttributeException(AttributeErrorCode.INTEGER_RANGE_INVALID)
                }
            }
            AttributeType.DECIMAL -> {
                // DECIMAL attributes should have min/max decimal, not int
                if (attribute.minInt != null || attribute.maxInt != null || attribute.defaultInt != null) {
                    throw AttributeException(AttributeErrorCode.INVALID_ATTRIBUTE_TYPE_CONFIGURATION)
                }
                // Validate range
                if (attribute.minDecimal != null && attribute.maxDecimal != null && attribute.minDecimal > attribute.maxDecimal) {
                    throw AttributeException(AttributeErrorCode.DECIMAL_RANGE_INVALID)
                }
                // Default must be within min..max
                attribute.defaultDecimal?.let { d ->
                    if (attribute.minDecimal != null && d < attribute.minDecimal) {
                        throw AttributeException(AttributeErrorCode.INVALID_ATTRIBUTE_TYPE_CONFIGURATION)
                    }
                    if (attribute.maxDecimal != null && d > attribute.maxDecimal) {
                        throw AttributeException(AttributeErrorCode.INVALID_ATTRIBUTE_TYPE_CONFIGURATION)
                    }
                }
            }
            AttributeType.BOOLEAN -> {
                // BOOLEAN attributes should not have numeric constraints
                if (attribute.minInt != null || attribute.maxInt != null || attribute.minDecimal != null || attribute.maxDecimal != null ||
                    attribute.defaultInt != null || attribute.defaultDecimal != null
                ) {
                    throw AttributeException(AttributeErrorCode.INVALID_ATTRIBUTE_TYPE_CONFIGURATION)
                }
            }
        }
    }
}

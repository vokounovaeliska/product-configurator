package cz.vokounova.configurator.products.attributes.infrastructure.persistence.mapper

import cz.vokounova.configurator.generated.jooq.tables.AttributeDefinition
import cz.vokounova.configurator.products.attributes.domain.AttributeSortableField
import org.jooq.Field

fun AttributeSortableField.toField(): Field<*> =
    when (this) {
        AttributeSortableField.CODE -> AttributeDefinition.ATTRIBUTE_DEFINITION.CODE
        AttributeSortableField.LABEL -> AttributeDefinition.ATTRIBUTE_DEFINITION.LABEL
        AttributeSortableField.TYPE -> AttributeDefinition.ATTRIBUTE_DEFINITION.TYPE
        AttributeSortableField.SORT_ORDER -> AttributeDefinition.ATTRIBUTE_DEFINITION.SORT_ORDER
        AttributeSortableField.CREATED_AT -> AttributeDefinition.ATTRIBUTE_DEFINITION.CREATED_AT
        AttributeSortableField.MODIFIED_AT -> AttributeDefinition.ATTRIBUTE_DEFINITION.MODIFIED_AT
    }

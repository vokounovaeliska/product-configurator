package cz.vokounova.configurator.products.infrastructure.persistence.mapper

import cz.vokounova.configurator.generated.jooq.tables.ComponentDefinition
import cz.vokounova.configurator.products.domain.ComponentSortableField
import org.jooq.Field

fun ComponentSortableField.toField(): Field<*> =
    when (this) {
        ComponentSortableField.CODE -> ComponentDefinition.COMPONENT_DEFINITION.CODE
        ComponentSortableField.LABEL -> ComponentDefinition.COMPONENT_DEFINITION.LABEL
        ComponentSortableField.SORT_ORDER -> ComponentDefinition.COMPONENT_DEFINITION.SORT_ORDER
        ComponentSortableField.CREATED_AT -> ComponentDefinition.COMPONENT_DEFINITION.CREATED_AT
        ComponentSortableField.MODIFIED_AT -> ComponentDefinition.COMPONENT_DEFINITION.MODIFIED_AT
    }

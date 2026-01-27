package cz.vokounova.configurator.shared.persistence.jooq

import org.jooq.TableField
import org.jooq.UpdatableRecord

/**
 * Marks the specified fields as unchanged, so they are excluded from INSERT and UPDATE statements.
 *
 * Useful for generated columns or computed fields that should not be written to the database.
 *
 * @param fields One or more TableFields to ignore in DML operations.
 * @return The current record instance (for fluent chaining).
 */
fun <R : UpdatableRecord<R>> R.ignoreFields(vararg fields: TableField<R, *>): R {
    fields.forEach { this.changed(it, false) }
    return this
}

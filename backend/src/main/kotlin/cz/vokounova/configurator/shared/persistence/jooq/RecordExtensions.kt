package cz.vokounova.configurator.shared.persistence.jooq

import org.jooq.TableField
import org.jooq.UpdatableRecord

fun <R : UpdatableRecord<R>> R.ignoreFields(vararg fields: TableField<R, *>): R {
    fields.forEach { this.changed(it, false) }
    return this
}

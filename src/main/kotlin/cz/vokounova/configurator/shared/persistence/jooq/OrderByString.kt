package cz.vokounova.configurator.shared.persistence.jooq

/**
 * OrderBy string
 *
 * Defines set of strings that can be used in database ordering, where ordering is defined by set of conditions
 *
 */
enum class OrderByString {
    /**
     * Can be used to order raws by string and place them on top (DESC) or bottom (ASC), depending on order direction
     */
    ZZZ,
}

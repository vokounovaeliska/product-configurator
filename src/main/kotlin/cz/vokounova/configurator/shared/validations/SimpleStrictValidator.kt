package cz.vokounova.configurator.shared.validations

/**
 * Simple strict application validator
 *
 * Base class for strict app validations
 * In case of validation error, validator MUST throw exception
 *
 */
interface SimpleStrictValidator<T> {
    fun validate(value: T)
}

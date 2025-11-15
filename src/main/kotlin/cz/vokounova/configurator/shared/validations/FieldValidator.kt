package cz.vokounova.configurator.shared.validations

abstract class FieldValidator<T> {
    abstract val field: String
    abstract val value: T?

    private val constraints: MutableList<FieldValidatorConstraint<T>> = mutableListOf()

    protected fun anyToDouble(any: Any?): Double? = any?.toString()?.toDoubleOrNull()

    fun getConstraints() = constraints.toList()

    fun addConstraint(
        message: String,
        code: BaseValidationCode,
        constraintValue: Any? = null,
        test: (T?) -> Boolean,
    ) {
        addConstraint(message, code.name, constraintValue, test)
    }

    fun addConstraint(
        message: String,
        code: String,
        constraintValue: Any? = null,
        test: (T?) -> Boolean,
    ) {
        constraints.add(
            FieldValidatorConstraint(
                field = field,
                value = value,
                message = message,
                code = code,
                constraintValue = constraintValue,
                test = test,
            ),
        )
    }
}

data class FieldValidatorConstraint<T>(
    val field: String,
    val value: T?,
    val code: String,
    val message: String,
    val constraintValue: Any? = null,
    val test: (T?) -> Boolean,
)

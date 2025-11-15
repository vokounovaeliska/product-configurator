package cz.vokounova.configurator.shared.validations

enum class BaseValidationCode(
    val annotationName: String,
) {
    FIELD_IS_NULL("NotNull"),
    FIELD_IS_EMPTY("NotEmpty"),
    FIELD_IS_BLANK("NotBlank"),
    INVALID_SIZE("Size"),
    VALUE_TOO_SMALL("Min"),
    VALUE_TOO_LARGE("Max"),
    INVALID_PATTERN("Pattern"),
    DATE_IN_PAST("Past"),
    DATE_IN_FUTURE("Future"),
    INVALID_DIGITS("Digits"),
    VALUE_NOT_POSITIVE("Positive"),
    VALUE_NOT_POSITIVE_OR_ZERO("PositiveOrZero"),
    VALUE_NOT_NEGATIVE("Negative"),
    VALUE_NOT_NEGATIVE_OR_ZERO("NegativeOrZero"),
    VALUE_NOT_TRUE("AssertTrue"),
    VALUE_NOT_FALSE("AssertFalse"),
    VALUE_BELOW_MINIMUM("DecimalMin"),
    VALUE_ABOVE_MAXIMUM("DecimalMax"),
    VALUE_BAD_FORMAT("BadFormat"),
    VALUE_IS_INVALID("InvalidValue"),
    DOES_NOT_MATCH_PATTERN("DoesNotMatchPattern"),
    FIELDS_NOT_MATCH("FieldsNotMatch"),
    IS_NOT_UNIQUE("NotUnique"),
    INVALID_REFERENCE("InvalidReference"),
    ;

    companion object {
        fun asMap() = entries.associate { it.annotationName to it.name }
    }
}

val validationAnnotationToCodeMap = BaseValidationCode.asMap()

package cz.vokounova.configurator.unit.products.attributes

import cz.vokounova.configurator.generated.jooq.enums.AttributeType
import cz.vokounova.configurator.mocks.AttributeMocks
import cz.vokounova.configurator.products.attributes.infrastructure.rest.validation.AttributeCreateParamsValidator
import cz.vokounova.configurator.shared.validations.BaseValidationCode
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.math.BigDecimal

class AttributeCreateParamsValidatorTest {
    private val validator = AttributeCreateParamsValidator()

    private val validParams = AttributeMocks.getAttributeCreateParams()

    @Test
    fun `Valid params pass validation`() {
        val errors = validator.validate(validParams)

        assertTrue(errors.isEmpty())
    }

    @Test
    fun `Validates empty code`() {
        val invalidParams = validParams.copy(code = "")
        val errors = validator.validate(invalidParams)

        assertEquals(1, errors.size)
        assertEquals(BaseValidationCode.FIELD_IS_EMPTY.name, errors.first().code)
    }

    @Test
    fun `Validates empty label`() {
        val invalidParams = validParams.copy(label = "")
        val errors = validator.validate(invalidParams)

        assertEquals(1, errors.size)
        assertEquals(BaseValidationCode.FIELD_IS_EMPTY.name, errors.first().code)
    }

    @Test
    fun `Validates negative sortOrder`() {
        val invalidParams = validParams.copy(sortOrder = -1)
        val errors = validator.validate(invalidParams)

        assertEquals(1, errors.size)
        assertEquals(BaseValidationCode.VALUE_TOO_SMALL.name, errors.first().code)
    }

    @Test
    fun `Validates INTEGER range when minInt is more than maxInt`() {
        val invalidParams =
            validParams.copy(
                type = AttributeType.INTEGER,
                minInt = 2000,
                maxInt = 800,
            )
        val errors = validator.validate(invalidParams)

        assertEquals(1, errors.size)
        assertEquals("minInt", errors.first().field)
    }

    @Test
    fun `Validates DECIMAL range when minDecimal is less than maxDecimal`() {
        val invalidParams =
            validParams.copy(
                type = AttributeType.DECIMAL,
                minDecimal = BigDecimal("100.5"),
                maxDecimal = BigDecimal("10.5"),
            )
        val errors = validator.validate(invalidParams)

        assertEquals(1, errors.size)
        assertEquals("minDecimal", errors.first().field)
    }

    @Test
    fun `Valid INTEGER range passes validation`() {
        val params =
            validParams.copy(
                type = AttributeType.INTEGER,
                minInt = 800,
                maxInt = 2000,
            )
        val errors = validator.validate(params)

        assertTrue(errors.isEmpty())
    }

    @Test
    fun `Valid DECIMAL range passes validation`() {
        val params =
            validParams.copy(
                type = AttributeType.DECIMAL,
                minDecimal = BigDecimal("10.5"),
                maxDecimal = BigDecimal("100.5"),
            )
        val errors = validator.validate(params)

        assertTrue(errors.isEmpty())
    }

    @Test
    fun `ENUM type with no numeric fields passes validation`() {
        val params =
            validParams.copy(
                type = AttributeType.ENUM,
                minInt = null,
                maxInt = null,
                minDecimal = null,
                maxDecimal = null,
            )
        val errors = validator.validate(params)

        assertTrue(errors.isEmpty())
    }

    @Test
    fun `BOOLEAN type with no numeric fields passes validation`() {
        val params =
            validParams.copy(
                type = AttributeType.BOOLEAN,
                minInt = null,
                maxInt = null,
                minDecimal = null,
                maxDecimal = null,
            )
        val errors = validator.validate(params)

        assertTrue(errors.isEmpty())
    }
}

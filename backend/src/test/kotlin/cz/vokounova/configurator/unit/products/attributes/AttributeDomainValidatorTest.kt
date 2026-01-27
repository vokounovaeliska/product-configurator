package cz.vokounova.configurator.unit.products.attributes

import cz.vokounova.configurator.generated.jooq.enums.AttributeType
import cz.vokounova.configurator.mocks.AttributeMocks
import cz.vokounova.configurator.products.attributes.application.exception.AttributeErrorCode
import cz.vokounova.configurator.products.attributes.application.exception.AttributeException
import cz.vokounova.configurator.products.attributes.application.validation.AttributeDomainValidator
import org.junit.jupiter.api.Assertions.assertDoesNotThrow
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import java.math.BigDecimal

class AttributeDomainValidatorTest {
    private val validator = AttributeDomainValidator()

    @Test
    fun `Valid ENUM attribute passes validation`() {
        val attribute =
            AttributeMocks.getAttribute(
                type = AttributeType.ENUM,
                minInt = null,
                maxInt = null,
                minDecimal = null,
                maxDecimal = null,
            )

        assertDoesNotThrow { validator.validate(attribute) }
    }

    @Test
    fun `ENUM attribute with numeric fields fails validation`() {
        val attribute =
            AttributeMocks.getAttribute(
                type = AttributeType.ENUM,
                minInt = 100,
                maxInt = null,
                minDecimal = null,
                maxDecimal = null,
            )

        val exception =
            assertThrows(AttributeException::class.java) {
                validator.validate(attribute)
            }

        assertEquals(AttributeErrorCode.INVALID_ATTRIBUTE_TYPE_CONFIGURATION.name, exception.code)
    }

    @Test
    fun `Valid INTEGER attribute passes validation`() {
        val attribute =
            AttributeMocks.getAttribute(
                type = AttributeType.INTEGER,
                minInt = 800,
                maxInt = 2000,
                minDecimal = null,
                maxDecimal = null,
            )

        assertDoesNotThrow { validator.validate(attribute) }
    }

    @Test
    fun `INTEGER attribute with decimal fields fails validation`() {
        val attribute =
            AttributeMocks.getAttribute(
                type = AttributeType.INTEGER,
                minInt = 800,
                maxInt = 2000,
                minDecimal = BigDecimal("10.5"),
                maxDecimal = null,
            )

        val exception =
            assertThrows(AttributeException::class.java) {
                validator.validate(attribute)
            }

        assertEquals(AttributeErrorCode.INVALID_ATTRIBUTE_TYPE_CONFIGURATION.name, exception.code)
    }

    @Test
    fun `INTEGER attribute with invalid range fails validation`() {
        val attribute =
            AttributeMocks.getAttribute(
                type = AttributeType.INTEGER,
                minInt = 2000,
                maxInt = 800, // min > max
                minDecimal = null,
                maxDecimal = null,
            )

        val exception =
            assertThrows(AttributeException::class.java) {
                validator.validate(attribute)
            }

        assertEquals(AttributeErrorCode.INTEGER_RANGE_INVALID.name, exception.code)
    }

    @Test
    fun `INTEGER attribute with equal min and max passes validation`() {
        val attribute =
            AttributeMocks.getAttribute(
                type = AttributeType.INTEGER,
                minInt = 1000,
                maxInt = 1000,
                minDecimal = null,
                maxDecimal = null,
            )

        assertDoesNotThrow { validator.validate(attribute) }
    }

    @Test
    fun `Valid DECIMAL attribute passes validation`() {
        val attribute =
            AttributeMocks.getAttribute(
                type = AttributeType.DECIMAL,
                minInt = null,
                maxInt = null,
                minDecimal = BigDecimal("10.5"),
                maxDecimal = BigDecimal("100.5"),
            )

        assertDoesNotThrow { validator.validate(attribute) }
    }

    @Test
    fun `DECIMAL attribute with integer fields fails validation`() {
        val attribute =
            AttributeMocks.getAttribute(
                type = AttributeType.DECIMAL,
                minInt = 10,
                maxInt = null,
                minDecimal = BigDecimal("10.5"),
                maxDecimal = BigDecimal("100.5"),
            )

        val exception =
            assertThrows(AttributeException::class.java) {
                validator.validate(attribute)
            }

        assertEquals(AttributeErrorCode.INVALID_ATTRIBUTE_TYPE_CONFIGURATION.name, exception.code)
    }

    @Test
    fun `DECIMAL attribute with invalid range fails validation`() {
        val attribute =
            AttributeMocks.getAttribute(
                type = AttributeType.DECIMAL,
                minInt = null,
                maxInt = null,
                minDecimal = BigDecimal("100.5"),
                maxDecimal = BigDecimal("10.5"), // min > max
            )

        val exception =
            assertThrows(AttributeException::class.java) {
                validator.validate(attribute)
            }

        assertEquals(AttributeErrorCode.DECIMAL_RANGE_INVALID.name, exception.code)
    }

    @Test
    fun `Valid BOOLEAN attribute passes validation`() {
        val attribute =
            AttributeMocks.getAttribute(
                type = AttributeType.BOOLEAN,
                minInt = null,
                maxInt = null,
                minDecimal = null,
                maxDecimal = null,
            )

        assertDoesNotThrow { validator.validate(attribute) }
    }

    @Test
    fun `BOOLEAN attribute with numeric fields fails validation`() {
        val attribute =
            AttributeMocks.getAttribute(
                type = AttributeType.BOOLEAN,
                minInt = 0,
                maxInt = 1,
                minDecimal = null,
                maxDecimal = null,
            )

        val exception =
            assertThrows(AttributeException::class.java) {
                validator.validate(attribute)
            }

        assertEquals(AttributeErrorCode.INVALID_ATTRIBUTE_TYPE_CONFIGURATION.name, exception.code)
    }

    @Test
    fun `INTEGER attribute with only min value passes validation`() {
        val attribute =
            AttributeMocks.getAttribute(
                type = AttributeType.INTEGER,
                minInt = 800,
                maxInt = null,
                minDecimal = null,
                maxDecimal = null,
            )

        assertDoesNotThrow { validator.validate(attribute) }
    }

    @Test
    fun `INTEGER attribute with only max value passes validation`() {
        val attribute =
            AttributeMocks.getAttribute(
                type = AttributeType.INTEGER,
                minInt = null,
                maxInt = 2000,
                minDecimal = null,
                maxDecimal = null,
            )

        assertDoesNotThrow { validator.validate(attribute) }
    }
}

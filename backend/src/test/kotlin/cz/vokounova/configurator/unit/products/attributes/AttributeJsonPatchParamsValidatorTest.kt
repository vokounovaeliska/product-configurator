package cz.vokounova.configurator.unit.products.attributes

import cz.vokounova.configurator.generated.jooq.enums.AttributeType
import cz.vokounova.configurator.products.attributes.domain.AttributeJsonPatchParams
import cz.vokounova.configurator.products.attributes.domain.AttributeJsonPatchParamsPath
import cz.vokounova.configurator.products.attributes.infrastructure.rest.validation.AttributeJsonPatchParamsValidator
import cz.vokounova.configurator.shared.rest.jsonpatch.JsonPatchOperation
import cz.vokounova.configurator.shared.validations.BaseValidationCode
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.math.BigDecimal

class AttributeJsonPatchParamsValidatorTest {
    private val validator = AttributeJsonPatchParamsValidator()

    @Test
    fun `Valid code patch passes validation`() {
        val params = AttributeJsonPatchParams(
            path = AttributeJsonPatchParamsPath.CODE,
            value = "NEW_CODE",
            op = JsonPatchOperation.REPLACE,
        )

        val errors = validator.validate(params)

        assertTrue(errors.isEmpty())
    }

    @Test
    fun `Validates null code`() {
        val params = AttributeJsonPatchParams(
            path = AttributeJsonPatchParamsPath.CODE,
            value = null,
            op = JsonPatchOperation.REPLACE,
        )

        val errors = validator.validate(params)

        assertEquals(1, errors.size)
        assertEquals(BaseValidationCode.FIELD_IS_NULL.name, errors.first().code)
    }

    @Test
    fun `Validates empty code`() {
        val params = AttributeJsonPatchParams(
            path = AttributeJsonPatchParamsPath.CODE,
            value = "",
            op = JsonPatchOperation.REPLACE,
        )

        val errors = validator.validate(params)

        assertEquals(1, errors.size)
        assertEquals(BaseValidationCode.FIELD_IS_EMPTY.name, errors.first().code)
    }

    @Test
    fun `Valid label patch passes validation`() {
        val params = AttributeJsonPatchParams(
            path = AttributeJsonPatchParamsPath.LABEL,
            value = "New Label",
            op = JsonPatchOperation.REPLACE,
        )

        val errors = validator.validate(params)

        assertTrue(errors.isEmpty())
    }

    @Test
    fun `Validates null label`() {
        val params = AttributeJsonPatchParams(
            path = AttributeJsonPatchParamsPath.LABEL,
            value = null,
            op = JsonPatchOperation.REPLACE,
        )

        val errors = validator.validate(params)

        assertEquals(1, errors.size)
        assertEquals(BaseValidationCode.FIELD_IS_NULL.name, errors.first().code)
    }

    @Test
    fun `Valid type patch passes validation`() {
        val params = AttributeJsonPatchParams(
            path = AttributeJsonPatchParamsPath.TYPE,
            value = AttributeType.ENUM,
            op = JsonPatchOperation.REPLACE,
        )

        val errors = validator.validate(params)

        assertTrue(errors.isEmpty())
    }

    @Test
    fun `Validates null type`() {
        val params = AttributeJsonPatchParams(
            path = AttributeJsonPatchParamsPath.TYPE,
            value = null,
            op = JsonPatchOperation.REPLACE,
        )

        val errors = validator.validate(params)

        assertEquals(1, errors.size)
        assertEquals(BaseValidationCode.FIELD_IS_NULL.name, errors.first().code)
    }

    @Test
    fun `Valid isRequired patch passes validation`() {
        val params = AttributeJsonPatchParams(
            path = AttributeJsonPatchParamsPath.IS_REQUIRED,
            value = false,
            op = JsonPatchOperation.REPLACE,
        )

        val errors = validator.validate(params)

        assertTrue(errors.isEmpty())
    }

    @Test
    fun `Validates null isRequired`() {
        val params = AttributeJsonPatchParams(
            path = AttributeJsonPatchParamsPath.IS_REQUIRED,
            value = null,
            op = JsonPatchOperation.REPLACE,
        )

        val errors = validator.validate(params)

        assertEquals(1, errors.size)
        assertEquals(BaseValidationCode.FIELD_IS_NULL.name, errors.first().code)
    }

    @Test
    fun `Valid minInt patch passes validation`() {
        val params = AttributeJsonPatchParams(
            path = AttributeJsonPatchParamsPath.MIN_INT,
            value = 100,
            op = JsonPatchOperation.REPLACE,
        )

        val errors = validator.validate(params)

        assertTrue(errors.isEmpty())
    }

    @Test
    fun `Valid maxInt patch passes validation`() {
        val params = AttributeJsonPatchParams(
            path = AttributeJsonPatchParamsPath.MAX_INT,
            value = 200,
            op = JsonPatchOperation.REPLACE,
        )

        val errors = validator.validate(params)

        assertTrue(errors.isEmpty())
    }

    @Test
    fun `Valid minDecimal patch passes validation`() {
        val params = AttributeJsonPatchParams(
            path = AttributeJsonPatchParamsPath.MIN_DECIMAL,
            value = BigDecimal("10.5"),
            op = JsonPatchOperation.REPLACE,
        )

        val errors = validator.validate(params)

        assertTrue(errors.isEmpty())
    }

    @Test
    fun `Valid maxDecimal patch passes validation`() {
        val params = AttributeJsonPatchParams(
            path = AttributeJsonPatchParamsPath.MAX_DECIMAL,
            value = BigDecimal("100.5"),
            op = JsonPatchOperation.REPLACE,
        )

        val errors = validator.validate(params)

        assertTrue(errors.isEmpty())
    }

    @Test
    fun `Valid sortOrder patch passes validation`() {
        val params = AttributeJsonPatchParams(
            path = AttributeJsonPatchParamsPath.SORT_ORDER,
            value = 5,
            op = JsonPatchOperation.REPLACE,
        )

        val errors = validator.validate(params)

        assertTrue(errors.isEmpty())
    }

    @Test
    fun `Validates null sortOrder`() {
        val params = AttributeJsonPatchParams(
            path = AttributeJsonPatchParamsPath.SORT_ORDER,
            value = null,
            op = JsonPatchOperation.REPLACE,
        )

        val errors = validator.validate(params)

        assertEquals(1, errors.size)
        assertEquals(BaseValidationCode.FIELD_IS_NULL.name, errors.first().code)
    }

    @Test
    fun `Validates negative sortOrder`() {
        val params = AttributeJsonPatchParams(
            path = AttributeJsonPatchParamsPath.SORT_ORDER,
            value = -1,
            op = JsonPatchOperation.REPLACE,
        )

        val errors = validator.validate(params)

        assertEquals(1, errors.size)
        assertEquals(BaseValidationCode.VALUE_TOO_SMALL.name, errors.first().code)
    }

    @Test
    fun `Null numeric values are allowed`() {
        val params = AttributeJsonPatchParams(
            path = AttributeJsonPatchParamsPath.MIN_INT,
            value = null,
            op = JsonPatchOperation.REPLACE,
        )

        val errors = validator.validate(params)

        assertTrue(errors.isEmpty())
    }
}

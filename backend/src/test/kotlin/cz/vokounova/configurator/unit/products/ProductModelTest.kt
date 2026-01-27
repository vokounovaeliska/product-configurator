package cz.vokounova.configurator.unit.products

import cz.vokounova.configurator.mocks.ProductModelMocks
import cz.vokounova.configurator.products.models.domain.ProductModel
import cz.vokounova.configurator.products.models.domain.ProductModelCreateParams
import cz.vokounova.configurator.users.api.dto.UserIdDto
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.util.UUID

class ProductModelTest {
    @Test
    fun `create should generate new ProductModel with all provided parameters`() {
        val userId = UserIdDto(UUID.randomUUID())
        val params =
            ProductModelCreateParams(
                userId = userId,
                name = "Custom Table",
                description = "A custom table",
                price = 2500.50,
                currency = "EUR",
                isActive = false,
            )

        val productModel = ProductModel.create(params)

        assertNotNull(productModel.id)
        assertEquals(userId, productModel.userId)
        assertEquals("Custom Table", productModel.name)
        assertEquals("A custom table", productModel.description)
        assertEquals(2500.50, productModel.price)
        assertEquals("EUR", productModel.currency)
        assertFalse(productModel.isActive)
        assertNotNull(productModel.createdAt)
        assertNotNull(productModel.modifiedAt)
        assertEquals(productModel.createdAt, productModel.modifiedAt)
    }

    @Test
    fun `create should use default values when optional parameters are null`() {
        val userId = UserIdDto(UUID.randomUUID())
        val params =
            ProductModelCreateParams(
                userId = userId,
                name = "Minimal Table",
                description = null,
                price = null,
                currency = null,
                isActive = null,
            )

        val productModel = ProductModel.create(params)

        assertEquals(userId, productModel.userId)
        assertEquals("Minimal Table", productModel.name)
        assertEquals(null, productModel.description)
        assertEquals(0.0, productModel.price)
        assertEquals("CZK", productModel.currency)
        assertTrue(productModel.isActive)
    }

    @Test
    fun `create should generate unique IDs for each ProductModel`() {
        val params = ProductModelMocks.getProductModelCreateParams()

        val productModel1 = ProductModel.create(params)
        val productModel2 = ProductModel.create(params)

        assertNotNull(productModel1.id)
        assertNotNull(productModel2.id)
        assertFalse(productModel1.id == productModel2.id)
    }

    @Test
    fun `create should set createdAt and modifiedAt to current timestamp`() {
        val params = ProductModelMocks.getProductModelCreateParams()
        val beforeCreation = java.time.OffsetDateTime.now()

        val productModel = ProductModel.create(params)

        val afterCreation = java.time.OffsetDateTime.now()
        assertTrue(productModel.createdAt.isAfter(beforeCreation.minusSeconds(1)))
        assertTrue(productModel.createdAt.isBefore(afterCreation.plusSeconds(1)))
        assertEquals(productModel.createdAt, productModel.modifiedAt)
    }

    @Test
    fun `create should handle zero price`() {
        val params = ProductModelMocks.getProductModelCreateParams(price = 0.0)

        val productModel = ProductModel.create(params)

        assertEquals(0.0, productModel.price)
    }

    @Test
    fun `create should handle large price values`() {
        val largePrice = 999999.99
        val params = ProductModelMocks.getProductModelCreateParams(price = largePrice)

        val productModel = ProductModel.create(params)

        assertEquals(largePrice, productModel.price)
    }

    @Test
    fun `create should handle empty description`() {
        val params = ProductModelMocks.getProductModelCreateParams(description = "")

        val productModel = ProductModel.create(params)

        assertEquals("", productModel.description)
    }

    @Test
    fun `create should handle different currencies`() {
        val currencies = listOf("CZK", "EUR", "USD", "GBP")

        currencies.forEach { currency ->
            val params = ProductModelMocks.getProductModelCreateParams(currency = currency)
            val productModel = ProductModel.create(params)
            assertEquals(currency, productModel.currency)
        }
    }

    @Test
    fun `create should handle inactive product model`() {
        val params = ProductModelMocks.getProductModelCreateParams(isActive = false)

        val productModel = ProductModel.create(params)

        assertFalse(productModel.isActive)
    }
}

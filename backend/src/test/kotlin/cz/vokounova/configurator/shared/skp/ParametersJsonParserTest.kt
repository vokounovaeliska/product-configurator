package cz.vokounova.configurator.shared.skp

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class ParametersJsonParserTest {
    @Test
    fun `parses parameters json with correct defaults and units`() {
        val jsonBytes =
            javaClass.classLoader
                .getResourceAsStream("parameters.json")
                ?.readBytes()
                ?: throw IllegalStateException("Missing src/test/resources/parameters.json")

        val result = ParametersJsonParser.parse(jsonBytes)

        assertTrue(result.isSuccess) { "Expected success: ${result.error}" }
        assertTrue(result.parameters.isNotEmpty()) { "Expected parameters" }

        // DECIMAL params with numeric defaults – must be parsed correctly
        val bottomLenx = result.parameters.find { it.name == "bottom_lenx" }
        assertNotNull(bottomLenx)
        assertEquals(117.9, bottomLenx!!.defaultDouble!!, 0.01)
        assertEquals("cm", bottomLenx.unit)

        val bottomLeny = result.parameters.find { it.name == "bottom_leny" }
        assertNotNull(bottomLeny)
        assertEquals(77.9, bottomLeny!!.defaultDouble!!, 0.01)
        assertEquals("cm", bottomLeny.unit)

        val topLenx = result.parameters.find { it.name == "top_lenx" }
        assertNotNull(topLenx)
        assertEquals(120.0, topLenx!!.defaultDouble!!, 0.01)
        assertEquals("cm", topLenx.unit)

        val width = result.parameters.find { it.name == "width" }
        assertNotNull(width)
        assertEquals(120.0, width!!.defaultDouble!!, 0.01)
        assertEquals("cm", width.unit)

        val height = result.parameters.find { it.name == "height" }
        assertNotNull(height)
        assertEquals(55.0, height!!.defaultDouble!!, 0.01)
        assertEquals("cm", height.unit)

        // ENUM param with default null – must stay null (not 0)
        val material = result.parameters.find { it.name == "material" }
        assertNotNull(material)
        assertNull(material!!.defaultDouble)
    }

    @Test
    fun `parameterDefaults map contains expected values for formula resolution`() {
        val jsonBytes =
            javaClass.classLoader
                .getResourceAsStream("parameters.json")
                ?.readBytes()
                ?: throw IllegalStateException("Missing src/test/resources/parameters.json")

        val result = ParametersJsonParser.parse(jsonBytes)

        assertTrue(result.isSuccess)
        assertTrue(result.parameterDefaults.isNotEmpty())

        assertEquals(117.9, result.parameterDefaults["BOTTOM_LENX"]!!, 0.01)
        assertEquals(77.9, result.parameterDefaults["BOTTOM_LENY"]!!, 0.01)
        assertEquals(120.0, result.parameterDefaults["TOP_LENX"]!!, 0.01)
        assertEquals(120.0, result.parameterDefaults["WIDTH"]!!, 0.01)
        assertEquals(55.0, result.parameterDefaults["HEIGHT"]!!, 0.01)

        // ENUM params with null default must not appear in parameterDefaults
        assertNull(result.parameterDefaults["MATERIAL"])
    }

    @Test
    fun `componentTransforms parsed with formulas and static values`() {
        val jsonBytes =
            javaClass.classLoader
                .getResourceAsStream("parameters.json")
                ?.readBytes()
                ?: throw IllegalStateException("Missing src/test/resources/parameters.json")

        val result = ParametersJsonParser.parse(jsonBytes)

        assertTrue(result.isSuccess)
        assertTrue(result.componentTransforms.isNotEmpty())

        val skupina = result.componentTransforms["Skupina"]
        assertNotNull(skupina)
        assertEquals("=width", skupina!!["width"])
        assertEquals("=height", skupina["height"])
        assertEquals("=depth", skupina["depth"])

        val leg1 = result.componentTransforms["leg1"]
        assertNotNull(leg1)
        assertEquals("=1", leg1!!["x"])
        assertEquals("=(parent! depth-LenY)/2", leg1["y"])
        assertEquals("=0", leg1["z"])
        assertEquals(6.0, leg1["lenx"])
        assertEquals(78.0, leg1["leny"])
        assertEquals(55.0, leg1["lenz"])
        assertEquals("black", leg1["material"])
        assertEquals("Skupina", leg1["_parent"])
    }

    @Test
    fun `components and model3dEffects parsed correctly`() {
        val jsonBytes =
            javaClass.classLoader
                .getResourceAsStream("parameters.json")
                ?.readBytes()
                ?: throw IllegalStateException("Missing src/test/resources/parameters.json")

        val result = ParametersJsonParser.parse(jsonBytes)

        assertTrue(result.isSuccess)
        assertTrue(result.meshNames.contains("Skupina#1"))
        assertTrue(result.meshNames.contains("bottom"))
        assertTrue(result.meshNames.contains("top"))

        assertTrue(result.model3dEffects.isNotEmpty())
        assertNotNull(result.model3dEffects["WIDTH"])
        assertNotNull(result.model3dEffects["HEIGHT"])
        assertNotNull(result.model3dEffects["DEPTH"])
    }
}

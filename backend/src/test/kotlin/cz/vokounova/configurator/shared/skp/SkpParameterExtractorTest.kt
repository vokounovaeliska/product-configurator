package cz.vokounova.configurator.shared.skp

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.nio.file.Files
import java.nio.file.Paths

class SkpParameterExtractorTest {
    companion object {
        /** SKP test file: place stul3.skp in src/test/resources as table.skp */
        private val tableSkpPath: java.nio.file.Path? by lazy {
            val url = javaClass.classLoader.getResource("table.skp") ?: return@lazy null
            try {
                Paths.get(url.toURI())
            } catch (_: Exception) {
                null
            }
        }
    }

    @Test
    fun `extracts parameters from minimal SKP with dynamic_attributes`() {
        val skpBytes = createMinimalSkpWithPrumer()
        val result = SkpParameterExtractor.extractParametersFromBytes(skpBytes)
        assertTrue(result.isSuccess, "Expected success: ${result.error}")
        assertTrue(result.parameters.isNotEmpty(), "Expected at least one parameter")
        val prumer = result.parameters.find { it.name == "prumer" }
        assertTrue(prumer != null, "Expected prumer in ${result.parameters.map { it.name }}")
        assertEquals("cm", prumer!!.unit)
    }

    @Test
    fun `extracts parameters from table SKP in resources`() {
        assertNotNull(tableSkpPath) { "Missing src/test/resources/table.skp (copy stul3.skp and rename to table.skp)" }
        assertTrue(Files.exists(tableSkpPath!!)) { "table.skp not found in test resources" }
        val result = SkpParameterExtractor.extractParameters(tableSkpPath!!)
        assertTrue(result.isSuccess, "Expected success: ${result.error}")
        assertTrue(result.parameters.isNotEmpty(), "Expected at least one parameter")
        val names = result.parameters.map { it.name }
        assertTrue("prumer" in names || "lenx" in names, "Expected prumer or lenx in $names")
    }

    private fun createMinimalSkpWithPrumer(): ByteArray {
        val header = ByteArray(69) { 0 }
        // Delimit formulaunits value so the extractor's greedy regex does not capture following attributes.
        // Use null byte so captured value is exactly "CENTIMETERS"; extractor normalizes to "cm".
        val modelDat =
            (
                "dynamic_attributes _prumer_formulaunits CENTIMETERS\u0000 " +
                    "_prumer_label prumer _prumer_units "
            ).toByteArray(Charsets.ISO_8859_1)
        val zipBytes = createZipWithModelDat(modelDat)
        return header + zipBytes
    }

    private fun createZipWithModelDat(modelDat: ByteArray): ByteArray {
        val tmpDir = Files.createTempDirectory("skp_test")
        try {
            val modelPath = tmpDir.resolve("model.dat")
            Files.write(modelPath, modelDat)
            val zipPath = tmpDir.resolve("out.zip")
            java.util.zip.ZipOutputStream(Files.newOutputStream(zipPath)).use { zos ->
                zos.putNextEntry(java.util.zip.ZipEntry("model.dat"))
                zos.write(modelDat)
                zos.closeEntry()
            }
            return Files.readAllBytes(zipPath)
        } finally {
            tmpDir.toFile().deleteRecursively()
        }
    }
}

package cz.vokounova.configurator.shared.files

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths

@Component
class UploadedFileDeleter(
    @Value("\${app.files.upload-dir}") private val uploadDir: String,
) {
    companion object {
        private val SAFE_FILENAME = Regex("^[a-zA-Z0-9_.-]+\$")
    }

    fun deleteByUrl(url: String?) {
        if (url.isNullOrBlank()) return
        val filename = filenameFromUrl(url) ?: return
        if (!SAFE_FILENAME.matches(filename)) return
        val path: Path = Paths.get(uploadDir, filename)
        if (Files.exists(path) && Files.isRegularFile(path)) {
            try {
                Files.delete(path)
            } catch (_: Exception) {
                Unit
            }
        }
    }

    private fun filenameFromUrl(url: String): String? {
        val pathPart = url.substringAfter("://").substringAfter("/")
        if (!pathPart.contains("api/v1/files/")) return null
        val afterPrefix = pathPart.substringAfter("api/v1/files/").trimStart('/')
        val filename = afterPrefix.split("/").firstOrNull() ?: return null
        return filename.ifBlank { null }
    }
}

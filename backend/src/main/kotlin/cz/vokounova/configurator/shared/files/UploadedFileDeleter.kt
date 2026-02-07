package cz.vokounova.configurator.shared.files

import org.springframework.stereotype.Component
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths

/**
 * Deletes files that were uploaded via [FileUploadController].
 * Used when an entity's image is replaced or the entity is deleted
 * so that old image files are not left on disk.
 */
@Component
class UploadedFileDeleter {

    companion object {
        private const val UPLOAD_DIR = "uploads/images"
        /** Filename: UUID plus optional extension (e.g. xxx.png) - no path traversal */
        private val SAFE_FILENAME = Regex("^[a-zA-Z0-9_.-]+\$")
    }

    /**
     * Deletes the file referenced by [url] if it is an uploaded file under our control.
     * Accepts relative paths like "/api/v1/files/uuid.png" or full URLs.
     * Does nothing if url is null/blank or does not point to our uploads.
     */
    fun deleteByUrl(url: String?) {
        if (url.isNullOrBlank()) return
        val filename = filenameFromUrl(url) ?: return
        if (!SAFE_FILENAME.matches(filename)) return
        val path: Path = Paths.get(UPLOAD_DIR, filename)
        if (Files.exists(path) && Files.isRegularFile(path)) {
            try {
                Files.delete(path)
            } catch (_: Exception) {
                // Log and ignore - avoid failing the main operation
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

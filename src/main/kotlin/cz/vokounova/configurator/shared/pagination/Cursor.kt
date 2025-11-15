package cz.vokounova.configurator.shared.pagination

import com.fasterxml.jackson.databind.ObjectMapper
import cz.vokounova.configurator.shared.pagination.jooq.PaginationMetadata
import org.springframework.stereotype.Component
import java.util.Base64

@JvmInline
value class EncodedCursor(
    val value: String,
)

@Component
class CursorCodec<T : PaginationMetadata>(
    private val objectMapper: ObjectMapper,
) {
    fun encode(value: T): EncodedCursor {
        val jsonString = objectMapper.writeValueAsString(value)
        val base64 = Base64.getUrlEncoder().encodeToString(jsonString.toByteArray())
        return EncodedCursor(base64)
    }

    fun decode(
        cursor: EncodedCursor,
        targetClass: Class<T>,
    ): T {
        val jsonString = String(Base64.getUrlDecoder().decode(cursor.value))
        return objectMapper.readValue(jsonString, targetClass)
    }
}

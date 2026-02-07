package cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.response

import cz.vokounova.configurator.generated.jooq.enums.AttributeType
import java.math.BigDecimal
import java.time.OffsetDateTime
import java.util.UUID

data class AttributeDto(
    val id: UUID,
    val componentId: UUID,
    val code: String,
    val label: String,
    val type: AttributeType,
    val isRequired: Boolean,
    val minInt: Int?,
    val maxInt: Int?,
    val minDecimal: BigDecimal?,
    val maxDecimal: BigDecimal?,
    val unit: String?,
    val sortOrder: Int,
    val createdAt: OffsetDateTime,
    val modifiedAt: OffsetDateTime,
)

data class AttributePaginatedResponseDto(
    val items: List<AttributeDto>,
    val pageMetadata: cz.vokounova.configurator.shared.rest.response.PaginatedResponseMetaDto,
)

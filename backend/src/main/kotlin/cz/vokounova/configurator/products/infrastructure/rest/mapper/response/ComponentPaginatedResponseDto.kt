package cz.vokounova.configurator.products.infrastructure.rest.mapper.response

import cz.vokounova.configurator.shared.rest.response.PaginatedResponseMetaDto

data class ComponentPaginatedResponseDto(
    val items: List<ComponentDto>,
    val pageMetadata: PaginatedResponseMetaDto,
)

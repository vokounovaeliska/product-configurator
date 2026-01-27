package cz.vokounova.configurator.products.infrastructure.rest.mapper.response

import cz.vokounova.configurator.shared.rest.response.PaginatedResponseMetaDto

data class ProductModelPaginatedResponseDto(
    val items: List<ProductModelDto>,
    val pageMetadata: PaginatedResponseMetaDto,
)

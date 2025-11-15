package cz.vokounova.configurator.users.infrastructure.rest.mapper.response

import cz.vokounova.configurator.shared.rest.response.PaginatedResponseMetaDto

data class UserPaginatedResponseDto(
    val items: List<UserDto>,
    val pageMetadata: PaginatedResponseMetaDto,
)

package cz.vokounova.configurator.products.models.domain

import cz.vokounova.configurator.users.api.dto.UserIdDto

data class ProductModelFilter(
    val ids: List<ProductModelId>? = null,
    val userIds: List<UserIdDto>? = null,
    val isActive: Boolean? = null,
    val isPublished: Boolean? = null,
)

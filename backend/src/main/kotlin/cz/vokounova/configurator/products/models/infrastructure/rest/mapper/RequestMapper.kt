package cz.vokounova.configurator.products.models.infrastructure.rest.mapper

import cz.vokounova.configurator.products.models.domain.ProductModelCreateParams
import cz.vokounova.configurator.products.models.domain.ProductModelFilter
import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.products.models.domain.ProductModelJsonPatchParams
import cz.vokounova.configurator.products.models.domain.ProductModelJsonPatchParamsPath
import cz.vokounova.configurator.products.models.infrastructure.rest.mapper.request.ProductModelCreateRequestDto
import cz.vokounova.configurator.products.models.infrastructure.rest.mapper.request.ProductModelPatchRequestDto
import cz.vokounova.configurator.products.models.infrastructure.rest.request.ProductModelListQueryParams
import cz.vokounova.configurator.shared.rest.jsonpatch.JsonPatchOperation
import cz.vokounova.configurator.users.api.dto.UserIdDto

fun ProductModelCreateRequestDto.toParams(userId: UserIdDto): ProductModelCreateParams =
    ProductModelCreateParams(
        userId = userId,
        name = name,
        description = description,
        price = price,
        currency = currency,
        isActive = isActive,
    )

fun ProductModelPatchRequestDto.toParams(): ProductModelJsonPatchParams =
    ProductModelJsonPatchParams(
        path =
            when (path) {
                ProductModelPatchRequestDto.Path.SlashName -> ProductModelJsonPatchParamsPath.NAME
                ProductModelPatchRequestDto.Path.SlashDescription -> ProductModelJsonPatchParamsPath.DESCRIPTION
                ProductModelPatchRequestDto.Path.SlashPrice -> ProductModelJsonPatchParamsPath.PRICE
                ProductModelPatchRequestDto.Path.SlashCurrency -> ProductModelJsonPatchParamsPath.CURRENCY
                ProductModelPatchRequestDto.Path.SlashIsActive -> ProductModelJsonPatchParamsPath.IS_ACTIVE
                ProductModelPatchRequestDto.Path.SlashModel3dUrl -> ProductModelJsonPatchParamsPath.MODEL_3D_URL
                ProductModelPatchRequestDto.Path.SlashUrl -> ProductModelJsonPatchParamsPath.URL
                ProductModelPatchRequestDto.Path.SlashIsPublished -> ProductModelJsonPatchParamsPath.IS_PUBLISHED
            },
        value = value,
        op =
            when (op) {
                ProductModelPatchRequestDto.Op.Replace -> JsonPatchOperation.REPLACE
            },
    )

fun ProductModelListQueryParams.toFilter(): ProductModelFilter =
    ProductModelFilter(
        ids = ids?.map { ProductModelId(it) },
        userIds = userIds?.map { UserIdDto(it) },
        isActive = isActive,
        isPublished = isPublished,
    )

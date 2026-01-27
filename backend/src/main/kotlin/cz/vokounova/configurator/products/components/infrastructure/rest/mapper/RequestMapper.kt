package cz.vokounova.configurator.products.components.infrastructure.rest.mapper

import cz.vokounova.configurator.products.components.domain.ComponentCreateParams
import cz.vokounova.configurator.products.components.domain.ComponentJsonPatchParams
import cz.vokounova.configurator.products.components.domain.ComponentJsonPatchParamsPath
import cz.vokounova.configurator.products.components.infrastructure.rest.mapper.request.ComponentCreateRequestDto
import cz.vokounova.configurator.products.components.infrastructure.rest.mapper.request.ComponentPatchRequestDto
import cz.vokounova.configurator.products.components.infrastructure.rest.mapper.request.ComponentPatchRequestDtoOp
import cz.vokounova.configurator.products.components.infrastructure.rest.mapper.request.ComponentPatchRequestDtoPath
import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.shared.rest.jsonpatch.JsonPatchOperation

fun ComponentCreateRequestDto.toParams(productModelId: ProductModelId): ComponentCreateParams =
    ComponentCreateParams(
        productModelId = productModelId,
        code = code,
        label = label,
        description = description,
        sortOrder = sortOrder,
    )

fun ComponentPatchRequestDto.toParams(): ComponentJsonPatchParams =
    ComponentJsonPatchParams(
        path =
            when (path) {
                ComponentPatchRequestDtoPath.SlashCode -> ComponentJsonPatchParamsPath.CODE
                ComponentPatchRequestDtoPath.SlashLabel -> ComponentJsonPatchParamsPath.LABEL
                ComponentPatchRequestDtoPath.SlashDescription -> ComponentJsonPatchParamsPath.DESCRIPTION
                ComponentPatchRequestDtoPath.SlashSortOrder -> ComponentJsonPatchParamsPath.SORT_ORDER
            },
        value = value,
        op =
            when (op) {
                ComponentPatchRequestDtoOp.Replace -> JsonPatchOperation.REPLACE
            },
    )

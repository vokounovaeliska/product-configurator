package cz.vokounova.configurator.products.infrastructure.rest.mapper

import cz.vokounova.configurator.shared.rest.jsonpatch.JsonPatchOperation
import cz.vokounova.configurator.products.domain.ComponentCreateParams
import cz.vokounova.configurator.products.domain.ComponentJsonPatchParams
import cz.vokounova.configurator.products.domain.ComponentJsonPatchParamsPath
import cz.vokounova.configurator.products.domain.ProductModelId
import cz.vokounova.configurator.products.infrastructure.rest.mapper.request.ComponentCreateRequestDto
import cz.vokounova.configurator.products.infrastructure.rest.mapper.request.ComponentPatchRequestDto
import java.util.UUID

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

package cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper

import cz.vokounova.configurator.products.attributes.domain.AttributeCreateParams
import cz.vokounova.configurator.products.attributes.domain.AttributeJsonPatchParams
import cz.vokounova.configurator.products.attributes.domain.AttributeJsonPatchParamsPath
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request.AttributeCreateRequestDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request.AttributePatchRequestDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request.AttributePatchRequestDtoOp
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request.AttributePatchRequestDtoPath
import cz.vokounova.configurator.products.components.domain.ComponentId
import cz.vokounova.configurator.shared.rest.jsonpatch.JsonPatchOperation

fun AttributeCreateRequestDto.toParams(componentId: ComponentId): AttributeCreateParams =
    AttributeCreateParams(
        componentId = componentId,
        code = code,
        label = label,
        type = type,
        isRequired = isRequired,
        minInt = minInt,
        maxInt = maxInt,
        minDecimal = minDecimal,
        maxDecimal = maxDecimal,
        sortOrder = sortOrder,
    )

fun AttributePatchRequestDto.toParams(): AttributeJsonPatchParams =
    AttributeJsonPatchParams(
        path =
            when (path) {
                AttributePatchRequestDtoPath.SlashCode -> AttributeJsonPatchParamsPath.CODE
                AttributePatchRequestDtoPath.SlashLabel -> AttributeJsonPatchParamsPath.LABEL
                AttributePatchRequestDtoPath.SlashType -> AttributeJsonPatchParamsPath.TYPE
                AttributePatchRequestDtoPath.SlashIsRequired -> AttributeJsonPatchParamsPath.IS_REQUIRED
                AttributePatchRequestDtoPath.SlashMinInt -> AttributeJsonPatchParamsPath.MIN_INT
                AttributePatchRequestDtoPath.SlashMaxInt -> AttributeJsonPatchParamsPath.MAX_INT
                AttributePatchRequestDtoPath.SlashMinDecimal -> AttributeJsonPatchParamsPath.MIN_DECIMAL
                AttributePatchRequestDtoPath.SlashMaxDecimal -> AttributeJsonPatchParamsPath.MAX_DECIMAL
                AttributePatchRequestDtoPath.SlashSortOrder -> AttributeJsonPatchParamsPath.SORT_ORDER
            },
        value = value,
        op =
            when (op) {
                AttributePatchRequestDtoOp.Replace -> JsonPatchOperation.REPLACE
            },
    )

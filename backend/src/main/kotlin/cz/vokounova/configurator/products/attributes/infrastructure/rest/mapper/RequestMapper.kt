package cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper

import cz.vokounova.configurator.products.attributes.domain.AttributeCreateParams
import cz.vokounova.configurator.products.attributes.domain.AttributeId
import cz.vokounova.configurator.products.attributes.domain.AttributeJsonPatchParams
import cz.vokounova.configurator.products.attributes.domain.AttributeJsonPatchParamsPath
import cz.vokounova.configurator.products.attributes.domain.AttributeOptionCreateParams
import cz.vokounova.configurator.products.attributes.domain.AttributeOptionJsonPatchParams
import cz.vokounova.configurator.products.attributes.domain.AttributeOptionJsonPatchParamsPath
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request.AttributeCreateRequestDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request.AttributeOptionCreateRequestDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request.AttributeOptionPatchRequestDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request.AttributeOptionPatchRequestDtoOp
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request.AttributeOptionPatchRequestDtoPath
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
        defaultInt = defaultInt,
        defaultDecimal = defaultDecimal,
        unit = unit,
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
                AttributePatchRequestDtoPath.SlashDefaultInt -> AttributeJsonPatchParamsPath.DEFAULT_INT
                AttributePatchRequestDtoPath.SlashDefaultDecimal -> AttributeJsonPatchParamsPath.DEFAULT_DECIMAL
                AttributePatchRequestDtoPath.SlashUnit -> AttributeJsonPatchParamsPath.UNIT
                AttributePatchRequestDtoPath.SlashSortOrder -> AttributeJsonPatchParamsPath.SORT_ORDER
            },
        value = value,
        op =
            when (op) {
                AttributePatchRequestDtoOp.Replace -> JsonPatchOperation.REPLACE
            },
    )

fun AttributeOptionCreateRequestDto.toParams(attributeId: AttributeId): AttributeOptionCreateParams =
    AttributeOptionCreateParams(
        attributeId = attributeId,
        value = value,
        label = label,
        imageUrl = imageUrl,
        sortOrder = sortOrder,
    )

fun AttributeOptionPatchRequestDto.toParams(): AttributeOptionJsonPatchParams =
    AttributeOptionJsonPatchParams(
        path =
            when (path) {
                AttributeOptionPatchRequestDtoPath.SlashValue -> AttributeOptionJsonPatchParamsPath.VALUE
                AttributeOptionPatchRequestDtoPath.SlashLabel -> AttributeOptionJsonPatchParamsPath.LABEL
                AttributeOptionPatchRequestDtoPath.SlashImageUrl -> AttributeOptionJsonPatchParamsPath.IMAGE_URL
                AttributeOptionPatchRequestDtoPath.SlashSortOrder -> AttributeOptionJsonPatchParamsPath.SORT_ORDER
            },
        value = value,
        op =
            when (op) {
                AttributeOptionPatchRequestDtoOp.Replace -> JsonPatchOperation.REPLACE
            },
    )

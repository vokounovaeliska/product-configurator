package cz.vokounova.configurator.embed.infrastructure.rest.mapper

import cz.vokounova.configurator.embed.infrastructure.rest.ProductModelEmbedDto
import cz.vokounova.configurator.products.api.dto.ProductModelExternalDto

fun ProductModelExternalDto.toEmbedDto(): ProductModelEmbedDto =
    ProductModelEmbedDto(
        id = id,
        name = name,
        description = description,
        price = price,
        currency = currency,
        model3dUrl = model3dUrl,
        model3dEffects = model3dEffects,
        url = url,
    )

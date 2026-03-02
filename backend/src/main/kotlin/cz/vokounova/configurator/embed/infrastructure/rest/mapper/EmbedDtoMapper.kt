package cz.vokounova.configurator.embed.infrastructure.rest.mapper

import cz.vokounova.configurator.embed.infrastructure.rest.ProductModelEmbedDto
import cz.vokounova.configurator.products.models.domain.ProductModel

fun ProductModel.toEmbedDto(): ProductModelEmbedDto =
    ProductModelEmbedDto(
        id = id.value,
        name = name,
        description = description,
        price = price,
        currency = currency,
        model3dUrl = model3dUrl,
        url = url,
    )

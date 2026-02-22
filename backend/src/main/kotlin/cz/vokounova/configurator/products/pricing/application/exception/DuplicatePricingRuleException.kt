package cz.vokounova.configurator.products.pricing.application.exception

import cz.vokounova.configurator.shared.exceptions.DuplicateResourceException

class DuplicatePricingRuleException(
    message: String = "A pricing rule already exists for this option. Each option can have only one pricing rule.",
) : DuplicateResourceException(message)

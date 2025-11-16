package cz.vokounova.configurator.shared.seeding

import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Component

@Component
@Profile("seed")
class ApplicationSeedingRunner(
    private val sources: List<SeedingSource>,
) : ApplicationRunner {
    override fun run(args: ApplicationArguments?) {
        sources.forEach { it.seed() }
    }
}

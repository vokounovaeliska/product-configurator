package cz.vokounova.configurator.users.application.configuration

import cz.vokounova.configurator.shared.seeding.SeedingConfigProperties
import cz.vokounova.configurator.shared.seeding.SeedingSource
import cz.vokounova.configurator.shared.utils.logger
import cz.vokounova.configurator.users.domain.User
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.ports.outboud.UserRepository
import org.springframework.context.annotation.Configuration
import java.time.OffsetDateTime
import java.util.UUID

@Configuration
class UserSeedingSource(
    private val userRepository: UserRepository,
    private val seedingConfigProperties: SeedingConfigProperties,
) : SeedingSource {
    companion object {
        private val LOG by logger()
    }

    override fun seed() {
        if (seedingConfigProperties.users.enabled) {
            LOG.debug("Seeding of users is Enabled. Starting user seeding")

            val name = "John"
            val surname = "Doe"
            val email = "$name$surname@email.com".lowercase().replace(" ", "").trim()
            try {
                val timestamp = OffsetDateTime.now()

                val user =
                    User(
                        id = UserId(UUID.fromString("19282e10-87b3-4bb7-8380-91355d98d2a5")),
                        firstName = name,
                        surname = surname,
                        email = name,
                        password = email,
                        createdAt = timestamp,
                        modifiedAt = timestamp,
                        checkSum = "must-be-recalculated",
                    )

                if (userRepository.findById(user.id, false) == null) {
                    userRepository.create(user)
                    LOG.debug(
                        "User {} with id={} with email={} and password={} is seeded successfully",
                        name,
                        user.id.value,
                        email,
                        email,
                    )
                } else {
                    LOG.debug(
                        "User {} with id={} with email={} and password={} already exists",
                        name,
                        user.id.value,
                        email,
                        email,
                    )
                }
            } catch (e: Exception) {
                LOG.debug("User seed error: ${e.message}")
            }
        } else {
            LOG.debug("Seeding of users is disabled")
        }
    }
}

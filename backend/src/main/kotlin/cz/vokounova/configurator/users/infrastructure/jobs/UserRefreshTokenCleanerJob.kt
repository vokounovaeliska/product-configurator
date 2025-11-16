package cz.vokounova.configurator.users.infrastructure.jobs

import cz.vokounova.configurator.shared.utils.logger
import cz.vokounova.configurator.users.ports.outboud.UserRefreshTokenRepository
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.OffsetDateTime

@Component
class UserRefreshTokenCleanerJob(
    private val userRefreshTokenRepository: UserRefreshTokenRepository,
) {
    companion object {
        val LOG by logger()
    }

    // Every hour
    @Scheduled(cron = "0 0 * * * *")
    fun deleteExpiredTokens() {
        LOG.info("Started job for deleting expired refresh tokens.")

        userRefreshTokenRepository.deleteExpiredTokens(OffsetDateTime.now())
    }
}

package cz.vokounova.configurator.integration.users

import cz.vokounova.configurator.configuration.BaseIntegrationTest
import cz.vokounova.configurator.generated.jooq.tables.references.USER_REFRESH_TOKEN
import cz.vokounova.configurator.shared.jwt.JwtTokenId
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.domain.UserRefreshToken
import cz.vokounova.configurator.users.infrastructure.jobs.UserRefreshTokenCleanerJob
import cz.vokounova.configurator.users.ports.outbound.UserRefreshTokenRepository
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import java.time.OffsetDateTime
import java.util.UUID

class UserRefreshTokenCleanerJobTest : BaseIntegrationTest() {
    lateinit var userRefreshTokenCleanerJob: UserRefreshTokenCleanerJob

    @Autowired
    lateinit var userRefreshTokenRepository: UserRefreshTokenRepository

    @BeforeEach
    fun setUp() {
        userRefreshTokenCleanerJob = UserRefreshTokenCleanerJob(userRefreshTokenRepository)
    }

    @AfterEach
    fun cleanup() {
        dslContext.truncate(USER_REFRESH_TOKEN).cascade().execute()
    }

    @Test
    fun `It deletes expired tokens`() {
        val date = OffsetDateTime.now()
        val newJwtId = JwtTokenId(UUID.fromString("defe415c-20bf-46e7-8531-99240c8d8c39"))
        val expiredJwtId = JwtTokenId(UUID.fromString("cd194412-9201-4418-9e6a-b7cda1300fd2"))

        userRefreshTokenRepository.createToken(
            UserRefreshToken(
                jwtId = newJwtId,
                userId = UserId(UUID.fromString("2bb66ff9-16c6-420e-a321-991653ac6675")),
                createdAt = date,
                expiresAt = date.plusMinutes(60),
            ),
        )

        userRefreshTokenRepository.createToken(
            UserRefreshToken(
                jwtId = expiredJwtId,
                userId = UserId(UUID.fromString("258c8655-61fb-494a-85e9-5aba584e94f9")),
                createdAt = date,
                expiresAt = date.minusDays(1),
            ),
        )

        val countBefore = userRefreshTokenRepository.getTokens().size

        assertEquals(2, countBefore)

        userRefreshTokenCleanerJob.deleteExpiredTokens()

        val tokensAfter = userRefreshTokenRepository.getTokens()

        assertEquals(1, tokensAfter.size)
        assertEquals(newJwtId, tokensAfter[0].jwtId)
    }
}

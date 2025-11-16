package cz.vokounova.configurator.unit.users

import cz.vokounova.configurator.mocks.UserMocks
import cz.vokounova.configurator.shared.exceptions.ApplicationException
import cz.vokounova.configurator.shared.exceptions.AuthErrorCode
import cz.vokounova.configurator.shared.exceptions.AuthException
import cz.vokounova.configurator.users.application.configuration.UserJwtService
import cz.vokounova.configurator.users.domain.UserId
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.time.OffsetDateTime
import java.util.UUID

class UserJwtServiceTest {
    private val service = UserJwtService(UserMocks.getJwtProperties())
    private val userId = UserId(UUID.fromString("eff5f177-9858-48a6-99e4-06c837ba08b4"))

    @Test
    fun `it returns authName from a JWT token`() {
        val token = service.generateAccessToken(userId)
        val userIdFromToken = service.getAuth(token.token)

        assertEquals(userId, userIdFromToken)
    }

    @Test
    fun `isExpired returns true if JWT token is expired`() {
        val token = service.generateAccessToken(userId, { OffsetDateTime.now().minusDays(1) })

        assertTrue(service.isExpired(token.token))
    }

    @Test
    fun `isExpired returns false if JWT token is not expired`() {
        val token = service.generateAccessToken(userId)

        assertFalse(service.isExpired(token.token))
    }

    @Test
    fun `isValid returns false if JWT token is invalid`() {
        val token = service.generateAccessToken(userId, { OffsetDateTime.now().minusDays(1) })

        assertFalse(service.isValid(token.token, userId))
    }

    @Test
    fun `isValid returns true if JWT token is valid`() {
        val token = service.generateAccessToken(userId)

        assertTrue(service.isValid(token.token, userId))
    }

    @Test
    fun `it throws exception if JWT token is invalid`() {
        val exception: ApplicationException =
            assertThrows(AuthException::class.java) {
                service.getAuth("INVALID_TOKEN")
            }

        assertEquals("Invalid token", exception.message)
        assertEquals(AuthErrorCode.INVALID_TOKEN.name, exception.code)
    }
}

package cz.vokounova.configurator.unit.users

import cz.vokounova.configurator.mocks.UserMocks
import cz.vokounova.configurator.shared.exceptions.ApplicationException
import cz.vokounova.configurator.shared.exceptions.CommonErrorCode
import cz.vokounova.configurator.shared.exceptions.ResourceNotFoundException
import cz.vokounova.configurator.users.application.configuration.UserDetailsService
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.ports.outbound.UserRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.kotlin.whenever

class UserDetailsServiceTest {
    private val userRepositoryMock = mock<UserRepository>()
    private val service = UserDetailsService(userRepositoryMock)

    private val user = UserMocks.getUser()

    @Test
    fun `it returns userDetails by email`() {
        whenever(userRepositoryMock.findByEmail(user.email)).thenReturn(user)

        val result = service.loadUserByUsername(user.email)!!

        assertEquals(user.email, result.username)
        assertEquals(user.id, UserId.from(result.id()))
        assertEquals(0, result.authorities.size)
    }

    @Test
    fun `it returns userDetails by id`() {
        whenever(userRepositoryMock.findById(user.id, false)).thenReturn(user)

        val result = service.loadUserById(user.id)!!

        assertEquals(user.email, result.username)
        assertEquals(user.id, UserId.from(result.id()))
        assertEquals(0, result.authorities.size)
    }

    @Test
    fun `it throws error with code RESOURCE_NOT_FOUND when user for email does not exist`() {
        whenever(userRepositoryMock.findByEmail(user.email)).thenThrow(ResourceNotFoundException("User not found"))

        val exception: ApplicationException =
            assertThrows(ResourceNotFoundException::class.java) {
                service.loadUserByUsername(user.email)
            }

        assertEquals(CommonErrorCode.RESOURCE_NOT_FOUND.name, exception.code)
    }

    @Test
    fun `it throws error with code RESOURCE_NOT_FOUND when user for id does not exist`() {
        whenever(userRepositoryMock.findById(user.id, false)).thenThrow(ResourceNotFoundException("User not found"))

        val exception: ApplicationException =
            assertThrows(ResourceNotFoundException::class.java) {
                service.loadUserById(user.id)
            }

        assertEquals(CommonErrorCode.RESOURCE_NOT_FOUND.name, exception.code)
    }
}

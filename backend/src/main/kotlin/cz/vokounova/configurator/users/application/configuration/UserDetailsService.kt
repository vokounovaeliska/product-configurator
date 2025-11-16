package cz.vokounova.configurator.users.application.configuration

import cz.vokounova.configurator.shared.security.AuthDetails
import cz.vokounova.configurator.shared.security.AuthId
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.ports.outboud.UserRepository
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.stereotype.Component

@Component("UserDetailsService")
class UserDetailsService(
    private val userRepository: UserRepository,
) : UserDetailsService {
    override fun loadUserByUsername(username: String): AuthDetails? =
        userRepository.findByEmail(username)?.let {
            AuthDetails(
                authId = AuthId(it.id.value),
                email = it.email,
                password = it.password,
                fullName = it.fullName(),
            )
        }

    fun loadUserById(id: UserId): AuthDetails? =
        userRepository.findById(id, false)?.let {
            AuthDetails(
                authId = AuthId(it.id.value),
                email = it.email,
                password = it.password,
                fullName = it.fullName(),
            )
        }
}

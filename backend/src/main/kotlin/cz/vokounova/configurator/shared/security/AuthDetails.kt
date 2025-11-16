package cz.vokounova.configurator.shared.security

import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import java.util.UUID

@JvmInline
value class AuthId(
    val value: UUID,
)

data class AuthDetails(
    private val authId: AuthId,
    private val email: String,
    private val fullName: String,
    private val password: String,
    private val authorities: MutableCollection<GrantedAuthority> = mutableListOf(),
) : UserDetails {
    override fun getAuthorities(): MutableCollection<out GrantedAuthority> = authorities

    override fun getPassword(): String = password

    override fun getUsername(): String = email

    fun id(): AuthId = authId

    fun fullName(): String = fullName
}

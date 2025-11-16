package cz.vokounova.configurator.shared.security

import org.springframework.security.core.Authentication

interface AuthFacade {
    fun getAuthentication(): Authentication

    fun getCurrentAuthDetails(): AuthDetails
}

package cz.vokounova.configurator.users.ports.inbound

import cz.vokounova.configurator.users.domain.UserAuthentication
import cz.vokounova.configurator.users.domain.UserAuthenticationRequestLoginPassword

interface UserLoginWithPassword {
    fun run(params: UserAuthenticationRequestLoginPassword): UserAuthentication
}

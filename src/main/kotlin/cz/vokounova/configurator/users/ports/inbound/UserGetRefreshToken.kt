package cz.vokounova.configurator.users.ports.inbound

import cz.vokounova.configurator.shared.jwt.JwtToken

interface UserGetRefreshToken {
    fun run(refreshToken: String): JwtToken
}

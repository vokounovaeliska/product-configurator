package cz.vokounova.configurator.users.application.configuration

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.stereotype.Component

@Component("UserPasswordEncoder")
class UserPasswordEncoder(
    val strength: Int = 13,
) : BCryptPasswordEncoder(strength)

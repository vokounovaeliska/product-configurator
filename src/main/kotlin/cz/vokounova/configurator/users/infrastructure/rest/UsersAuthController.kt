package cz.vokounova.configurator.users.infrastructure.rest

import cz.vokounova.configurator.shared.utils.logger
import cz.vokounova.configurator.users.domain.UserAuthenticationRequestLoginPassword
import cz.vokounova.configurator.users.infrastructure.rest.mapper.request.LoginCredentialsDto
import cz.vokounova.configurator.users.infrastructure.rest.mapper.response.JwtTokenDto
import cz.vokounova.configurator.users.ports.inbound.UserGetRefreshToken
import cz.vokounova.configurator.users.ports.inbound.UserLoginWithPassword
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseCookie
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component
import org.springframework.web.bind.annotation.CookieValue
import org.springframework.web.bind.annotation.RequestBody

@Component
class UsersAuthController(
    private val userLoginWithLoginPassword: UserLoginWithPassword,
    private val userRefreshToken: UserGetRefreshToken,
) {
    companion object {
        const val REFRESH_TOKEN_COOKIE = "refresh_token"

        val LOG by logger()
    }

    fun getUserRefreshToken(
        @CookieValue(name = REFRESH_TOKEN_COOKIE) refreshToken: String,
    ): ResponseEntity<JwtTokenDto> =
        ResponseEntity
            .ok()
            .body(JwtTokenDto(userRefreshToken.run(refreshToken).token))

    fun userAuthLogin(
        @RequestBody loginCredentialsDto: LoginCredentialsDto,
    ): ResponseEntity<JwtTokenDto> {
        val authResult =
            userLoginWithLoginPassword.run(
                UserAuthenticationRequestLoginPassword(loginCredentialsDto.email, loginCredentialsDto.password),
            )

        val refreshTokenCookie =
            ResponseCookie
                .from(REFRESH_TOKEN_COOKIE)
                .value(authResult.refreshToken)
                .secure(true)
                .httpOnly(true)
                .sameSite("None")
                .path("/users/api/v1/auth")
                .build()

        return ResponseEntity
            .status(HttpStatus.OK)
            .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
            .body(JwtTokenDto(authResult.accessToken))
    }

    // Logout is completely handled by Spring Boot in UserSecurityConfiguration.logout
    fun userLogout(
        @CookieValue(name = REFRESH_TOKEN_COOKIE) refreshToken: String,
    ): ResponseEntity<Unit> = throw IllegalStateException("This method should not be called!")
}

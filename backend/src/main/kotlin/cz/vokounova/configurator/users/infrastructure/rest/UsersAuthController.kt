package cz.vokounova.configurator.users.infrastructure.rest

import cz.vokounova.configurator.shared.exceptions.AuthErrorCode
import cz.vokounova.configurator.shared.exceptions.AuthException
import cz.vokounova.configurator.shared.exceptions.throwIfNotEmpty
import cz.vokounova.configurator.shared.security.extractBearerTokenValue
import cz.vokounova.configurator.users.domain.UserAuthenticationRequestLoginPassword
import cz.vokounova.configurator.users.infrastructure.rest.mapper.request.LoginCredentialsDto
import cz.vokounova.configurator.users.infrastructure.rest.mapper.request.UserCreateRequestDto
import cz.vokounova.configurator.users.infrastructure.rest.mapper.response.JwtTokenDto
import cz.vokounova.configurator.users.infrastructure.rest.mapper.response.UserDto
import cz.vokounova.configurator.users.infrastructure.rest.mapper.toDto
import cz.vokounova.configurator.users.infrastructure.rest.mapper.toParams
import cz.vokounova.configurator.users.infrastructure.rest.validation.UserCreateParamsValidator
import cz.vokounova.configurator.users.ports.inbound.UserAPI
import cz.vokounova.configurator.users.ports.inbound.UserGetRefreshToken
import cz.vokounova.configurator.users.ports.inbound.UserLoginWithPassword
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseCookie
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.CookieValue
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/users/api/v1/auth")
class UsersAuthController(
    private val userLoginWithLoginPassword: UserLoginWithPassword,
    private val userRefreshToken: UserGetRefreshToken,
    private val userAPI: UserAPI,
    private val createParamsValidator: UserCreateParamsValidator,
) {
    companion object {
        const val REFRESH_TOKEN_COOKIE = "refresh_token"
    }

    @GetMapping("/refresh")
    fun getUserRefreshToken(
        @RequestHeader(HttpHeaders.AUTHORIZATION, required = false) authorization: String?,
        @CookieValue(name = REFRESH_TOKEN_COOKIE, required = false) refreshTokenCookie: String?,
    ): ResponseEntity<JwtTokenDto> {
        val refreshToken =
            authorization?.takeIf { it.isNotBlank() }?.extractBearerTokenValue()
                ?: refreshTokenCookie?.takeIf { it.isNotBlank() }
                ?: throw AuthException(AuthErrorCode.INVALID_REFRESH_TOKEN)
        return ResponseEntity
            .ok()
            .body(JwtTokenDto(userRefreshToken.run(refreshToken).token))
    }

    @PostMapping("/public/login")
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

    @PostMapping("/public/register")
    fun userRegistration(
        @RequestBody userCreateRequestDto: UserCreateRequestDto,
    ): ResponseEntity<UserDto> {
        val params = userCreateRequestDto.toParams()
        createParamsValidator.validate(params).throwIfNotEmpty()
        val user = userAPI.create(params)

        return ResponseEntity.status(HttpStatus.CREATED).body(user.toDto())
    }

    // Logout is completely handled by Spring Boot in UserSecurityConfiguration.logout
    fun userLogout(
        @CookieValue(name = REFRESH_TOKEN_COOKIE) refreshToken: String,
    ): ResponseEntity<Unit> = throw IllegalStateException("This method should not be called!")
}

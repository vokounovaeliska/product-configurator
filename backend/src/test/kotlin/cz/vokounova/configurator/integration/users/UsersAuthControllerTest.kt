package cz.vokounova.configurator.integration.users

import cz.vokounova.configurator.configuration.BaseIntegrationTest
import cz.vokounova.configurator.generated.jooq.tables.references.USER
import cz.vokounova.configurator.generated.jooq.tables.references.USER_REFRESH_TOKEN
import cz.vokounova.configurator.mocks.UserMocks
import cz.vokounova.configurator.users.application.configuration.UserJwtService
import cz.vokounova.configurator.users.domain.UserRefreshToken
import cz.vokounova.configurator.users.infrastructure.rest.mapper.response.JwtTokenDto
import cz.vokounova.configurator.users.ports.outboud.UserRefreshTokenRepository
import cz.vokounova.configurator.users.ports.outboud.UserRepository
import jakarta.servlet.http.Cookie
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.time.OffsetDateTime

class UsersAuthControllerTest : BaseIntegrationTest() {
    companion object {
        private const val LOGIN_URL = "/users/api/v1/auth/public/login"
        private const val REFRESH_URL = "/users/api/v1/auth/refresh"
        private const val LOGOUT_URL = "/users/api/v1/auth/logout"
        private const val USERS_URL = "/users/api/v1/users"
        private const val REFRESH_TOKEN_COOKIE = "refresh_token"
    }

    @Autowired
    protected lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var userRepository: UserRepository

    @Autowired
    lateinit var refreshTokenRepository: UserRefreshTokenRepository

    @Autowired
    lateinit var jwtService: UserJwtService

    @BeforeEach
    override fun cleanUp() {
        dslContext.truncate(USER).cascade().execute()
        dslContext.truncate(USER_REFRESH_TOKEN).cascade().execute()
    }

    @Test
    fun `Login - Returns access token for existing user`() {
        val user = UserMocks.getUser()
        userRepository.create(user)

        val payload = "{\"email\":\"${user.email}\",\"password\":\"${user.password}\"}"

        val result =
            mockMvc
                .perform(
                    post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<JwtTokenDto>(result)
        assertNotNull(parsedResult)
        assertFalse(parsedResult.token.isNullOrBlank())

        val cookie = result.response.getCookie(REFRESH_TOKEN_COOKIE)

        assertFalse(cookie?.value.isNullOrBlank())
    }

    @Test
    fun `Login - throws 401 if user does not exist`() {
        val user = UserMocks.getUser()
        val payload = "{\"email\":\"${user.email}\",\"password\":\"${user.password}\"}"

        mockMvc
            .perform(
                post(LOGIN_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(payload),
            ).andExpect(status().isUnauthorized)
    }

    @Test
    fun `Login - throws 401 if login have bad password`() {
        val user = UserMocks.getUser()

        userRepository.create(user)

        val payload = "{\"email\":\"${user.email}\",\"password\":\"INVALID\"}"

        mockMvc
            .perform(
                post(LOGIN_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(payload),
            ).andExpect(status().isUnauthorized)
    }

    @Test
    fun `Login - throws 401 if login have bad email`() {
        val user = UserMocks.getUser()

        userRepository.create(user)

        val payload = "{\"email\":\"INVALID@email.com\",\"password\":\"${user.password}\"}"

        mockMvc
            .perform(
                post(LOGIN_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(payload),
            ).andExpect(status().isUnauthorized)
    }

    @Test
    fun `Login - throws 400 error if payload is invalid`() {
        val payload = "{\"email\":\"johndoe@email.com\",\"password\":\"johndoe\",\"languageC"

        mockMvc
            .perform(
                post(LOGIN_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(payload),
            ).andExpect(status().is4xxClientError)
    }

    @Test
    fun `Refresh - returns new access token`() {
        val user = UserMocks.getUser()
        val refreshToken = jwtService.generateRefreshToken(user.id)

        userRepository.create(user)
        refreshTokenRepository.createToken(
            UserRefreshToken(
                jwtId = refreshToken.id,
                userId = user.id,
                createdAt = OffsetDateTime.now(),
                expiresAt = refreshToken.expiresAt,
            ),
        )

        val result =
            mockMvc
                .perform(
                    get(REFRESH_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer ${refreshToken.token}"),
                ).andExpect(status().is2xxSuccessful)
                .andReturn()

        val parsedResult = readResponse<JwtTokenDto>(result)
        assertNotNull(parsedResult)
        assertFalse(parsedResult.token.isNullOrBlank())
    }

    @Test
    fun `Refresh - throw EXPIRED_REFRESH_TOKEN error when token is expired`() {
        val user = UserMocks.getUser()
        val refreshToken = jwtService.generateRefreshToken(user.id, { OffsetDateTime.now().minusDays(1) })

        mockMvc
            .perform(
                get(REFRESH_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer ${refreshToken.token}"),
            ).andExpect(status().isUnauthorized)
            .andExpect(jsonPath("$.errors[0].code").value("EXPIRED_REFRESH_TOKEN"))
    }

    @Test
    fun `Refresh - throw INVALID_REFRESH_TOKEN error if user does not exist`() {
        val user = UserMocks.getUser()
        val refreshToken = jwtService.generateRefreshToken(user.id)

        mockMvc
            .perform(
                get(REFRESH_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer ${refreshToken.token}"),
            ).andExpect(status().isUnauthorized)
            .andExpect(jsonPath("$.errors[0].code").value("INVALID_REFRESH_TOKEN"))
            .andExpect(jsonPath("$.errors[0].message").value("Invalid refresh token"))
    }

    @Test
    fun `Refresh - throw 401 error if refresh token does not exist`() {
        val user = UserMocks.getUser()
        val refreshToken = jwtService.generateRefreshToken(user.id)

        userRepository.create(user)

        mockMvc
            .perform(
                get(REFRESH_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer ${refreshToken.token}"),
            ).andExpect(status().isUnauthorized)
            .andExpect(jsonPath("$.errors[0].code").value("INVALID_REFRESH_TOKEN"))
            .andExpect(jsonPath("$.errors[0].message").value("Invalid refresh token"))
    }

    @Test
    fun `Logout - logouts user, deletes cookie, delete refresh token`() {
        val user = UserMocks.getUser()

        userRepository.create(user)

        val payload = "{\"email\":\"${user.email}\",\"password\":\"${user.password}\"}"

        val loginResult =
            mockMvc
                .perform(
                    post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedLoginResult = readResponse<JwtTokenDto>(loginResult)
        assertNotNull(parsedLoginResult)
        assertFalse(parsedLoginResult.token.isNullOrBlank())

        val cookieAfterLogin = loginResult.response.getCookie(REFRESH_TOKEN_COOKIE)
        val refreshTokensCountAfterLogin = refreshTokenRepository.getTokens().size

        assertFalse(cookieAfterLogin?.value.isNullOrBlank())
        assertEquals(1, refreshTokensCountAfterLogin)

        val logoutResult =
            mockMvc
                .perform(
                    post(LOGOUT_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .cookie(cookieAfterLogin),
                ).andExpect(status().is2xxSuccessful)

        val cookieAfterLogout = logoutResult.andReturn().response.getCookie(REFRESH_TOKEN_COOKIE)
        val refreshTokensCountAfterLogout = refreshTokenRepository.getTokens().size

        assertTrue(cookieAfterLogout?.value.isNullOrBlank())
        assertEquals(0, refreshTokensCountAfterLogout)
    }

    @Test
    fun `Logout - returns 200 even if auth token is missing`() {
        val cookie = Cookie(REFRESH_TOKEN_COOKIE, "whatever")

        mockMvc
            .perform(
                post(LOGOUT_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .cookie(cookie),
            ).andExpect(status().is2xxSuccessful)
    }

    @Test
    fun `Access - throw 401 error if user is deleted`() {
        val user = UserMocks.getUser()
        userRepository.create(user)

        val accessToken = jwtService.generateAccessToken(user.id, { OffsetDateTime.now().plusHours(1) })

        userRepository.delete(user.id)

        mockMvc
            .perform(
                get(USERS_URL)
                    .header("Authorization", "Bearer ${accessToken.token}")
                    .contentType(MediaType.APPLICATION_JSON),
            ).andExpect(status().isUnauthorized)
            .andExpect(jsonPath("$.errors[0].code").value("UNAUTHORIZED"))
    }
}

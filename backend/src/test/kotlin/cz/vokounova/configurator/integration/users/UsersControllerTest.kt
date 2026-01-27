package cz.vokounova.configurator.integration.users

import cz.vokounova.configurator.configuration.BaseIntegrationTest
import cz.vokounova.configurator.generated.jooq.tables.references.USER
import cz.vokounova.configurator.mocks.AuthMocks
import cz.vokounova.configurator.mocks.UserMocks
import cz.vokounova.configurator.users.domain.UserChangePasswordParams
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.infrastructure.rest.mapper.request.UserCreateRequestDto
import cz.vokounova.configurator.users.infrastructure.rest.mapper.request.UserMeChangePasswordRequestDto
import cz.vokounova.configurator.users.infrastructure.rest.mapper.request.UserPatchRequestDto
import cz.vokounova.configurator.users.infrastructure.rest.mapper.response.UserDto
import cz.vokounova.configurator.users.infrastructure.rest.mapper.response.UserPaginatedResponseDto
import cz.vokounova.configurator.users.ports.outboud.UserRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.Base64
import java.util.UUID

class UsersControllerTest : BaseIntegrationTest() {
    companion object {
        private const val USERS_URL = "/users/api/v1/users"
    }

    @Autowired
    protected lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var userRepository: UserRepository

    private fun getUser(userId: UserId) = userRepository.findById(userId, false)!!

    private val userId0: UserId = UserId(UUID.fromString("00000000-0000-0000-0000-000000000000"))
    private val userId1: UserId = UserId(UUID.fromString("11111111-1111-1111-1111-111111111111"))
    private val userId2: UserId = UserId(UUID.fromString("22222222-2222-2222-2222-222222222222"))
    private val userId3: UserId = UserId(UUID.fromString("33333333-3333-3333-3333-333333333333"))

    @BeforeEach
    override fun cleanUp() {
        dslContext.truncate(USER).cascade().execute()
    }

    @Test
    fun `Get - Returns single user`() {
        val user = UserMocks.getUser()

        userRepository.create(user)

        val result =
            mockMvc
                .perform(
                    get("$USERS_URL/${user.id.value}")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserDto>(result)

        assertNotNull(parsedResult)

        assertEquals(user.id.value, parsedResult.id)
        assertEquals(user.firstName, parsedResult.firstName)
        assertEquals(user.surname, parsedResult.surname)
        assertEquals(user.email, parsedResult.email)
        assertNotNull(parsedResult.createdAt)
        assertNotNull(parsedResult.modifiedAt)
    }

    @Test
    fun `Delete - Delete user`() {
        val user = UserMocks.getUser()

        userRepository.create(user)

        val u = UserMocks.getUser(email = "whatever")
        userRepository.create(u)

        assertEquals(2, userRepository.findByFilter().size)

        mockMvc
            .perform(
                delete("$USERS_URL/${user.id.value}")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockUser(userId = u.id, email = u.email)),
            ).andExpect(status().isNoContent)

        assertEquals(1, userRepository.findByFilter().size)
        assertEquals(u.email, userRepository.findByFilter().first().email)
    }

    @Test
    fun `Delete - Delete own account`() {
        val user = UserMocks.getUser()

        userRepository.create(user)

        assertEquals(1, userRepository.findByFilter().size)

        mockMvc
            .perform(
                delete("$USERS_URL/${user.id.value}")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockUser(userId = user.id, email = user.email)),
            ).andExpect(status().isNoContent)

        assertEquals(0, userRepository.findByFilter().size)
    }

    @Test
    fun `Create - creates user`() {
        val password = "SecurePassword123"

        val params =
            UserCreateRequestDto(
                firstName = "John",
                surname = "Test",
                email = "john-test@example.com",
                password = password,
                confirmPassword = password,
            )

        val payload = objectMapper.writeValueAsString(params)

        val u = UserMocks.getUser(email = "whatever")
        userRepository.create(u)

        val result =
            mockMvc
                .perform(
                    post(USERS_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = u.id, email = u.email))
                        .content(payload),
                ).andExpect(status().isCreated)
                .andReturn()

        val parsedResult = readResponse<UserDto>(result)

        assertNotNull(parsedResult)
        assertNotNull(parsedResult.id)

        assertEquals(params.firstName, parsedResult.firstName)
        assertEquals(params.surname, parsedResult.surname)
        assertEquals(params.email, parsedResult.email)

        assertNotNull(parsedResult.createdAt)
        assertNotNull(parsedResult.modifiedAt)

        val hashedPassword = getUser(UserId(parsedResult.id)).password
        assertNotNull(hashedPassword)
        assertNotEquals(password, hashedPassword)
    }

    @Test
    fun `Patch - partial update of user`() {
        val user = UserMocks.getUser()

        userRepository.create(user)

        val u = UserMocks.getUser(email = "whatever")
        userRepository.create(u)

        val oldUser = getUser(user.id)
        val oldModifiedAt = oldUser.modifiedAt
        val oldCreatedAt = oldUser.createdAt

        val newFirstName = "new first name"
        val newEmail = "new-email@example.com"
        val newSurname = "new surname"
        val oldCheckSum = oldUser.checkSum

        val params =
            listOf(
                UserPatchRequestDto(
                    path = UserPatchRequestDto.Path.SlashFirstName,
                    value = newFirstName,
                    op = UserPatchRequestDto.Op.Replace,
                ),
                UserPatchRequestDto(
                    path = UserPatchRequestDto.Path.SlashEmail,
                    value = newEmail,
                    op = UserPatchRequestDto.Op.Replace,
                ),
                UserPatchRequestDto(
                    path = UserPatchRequestDto.Path.SlashSurname,
                    value = newSurname,
                    op = UserPatchRequestDto.Op.Replace,
                ),
            )

        val payload = objectMapper.writeValueAsString(params)

        val result =
            mockMvc
                .perform(
                    patch("$USERS_URL/${user.id.value}")
                        .contentType("application/json-patch+json")
                        .with(AuthMocks.mockUser(userId = u.id, email = u.email))
                        .content(payload),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserDto>(result)

        val updatedUser = getUser(user.id)
        val newModifiedAt = updatedUser.modifiedAt
        val newCreatedAt = updatedUser.createdAt
        val newCheckSum = updatedUser.checkSum

        assertEquals(newFirstName, parsedResult.firstName)
        assertEquals(newSurname, parsedResult.surname)
        assertEquals(newEmail, parsedResult.email)
        assertEquals(oldCreatedAt, newCreatedAt)

        assertNotEquals(oldModifiedAt, newModifiedAt)
        assertNotEquals(oldCheckSum, newCheckSum)
    }

    @Test
    fun `Get - get logged in user's info`() {
        val user = UserMocks.getUser()

        userRepository.create(user)

        val result =
            mockMvc
                .perform(
                    get("$USERS_URL/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockUser(userId = user.id, email = user.email)),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserDto>(result)

        assertNotNull(parsedResult)
        assertEquals(user.id.value, parsedResult.id)
        assertEquals(user.fullName(), "${parsedResult.firstName} ${parsedResult.surname}")
    }

    @Test
    fun `Post - change user's password`() {
        val user = UserMocks.getUser()

        userRepository.create(user)

        val oldUser = getUser(user.id)
        val oldUserPassword = oldUser.password
        val oldUserModifiedAt = oldUser.modifiedAt

        val newPassword = "SecurePassword123"
        val params =
            UserChangePasswordParams(
                newPassword = newPassword,
                confirmNewPassword = newPassword,
            )

        val payload = objectMapper.writeValueAsString(params)

        mockMvc
            .perform(
                put("$USERS_URL/${user.id.value}/password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockAdmin())
                    .content(payload),
            ).andExpect(status().isNoContent)

        val updatedUser = getUser(user.id)
        assertNotEquals(oldUserPassword, updatedUser.password)
        assertNotEquals(oldUserModifiedAt, updatedUser.modifiedAt)
    }

    @Test
    fun `Post - change logged in user's password`() {
        val user = UserMocks.getUser()

        userRepository.create(user)

        val oldUser = getUser(user.id)
        val oldUserPassword = oldUser.password
        val oldUserModifiedAt = oldUser.modifiedAt

        val newPassword = "SecurePassword123"
        val params =
            UserMeChangePasswordRequestDto(
                oldPassword = user.password,
                newPassword = newPassword,
                confirmNewPassword = newPassword,
            )

        val payload = objectMapper.writeValueAsString(params)

        mockMvc
            .perform(
                put("$USERS_URL/me/password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .with(AuthMocks.mockUser(userId = user.id, email = user.email))
                    .content(payload),
            ).andExpect(status().isNoContent)

        val updatedUser = getUser(user.id)
        assertNotEquals(oldUserPassword, updatedUser.password)
        assertNotEquals(oldUserModifiedAt, updatedUser.modifiedAt)
    }

    @Test
    fun `List - Returns paginated list of users sorted by created at desc if no order by defined`() {
        val userA =
            UserMocks.getUser(
                id = userId0,
                firstName = "SharedName",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userA)

        val userB =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bonnie",
                surname = "SharedName",
                email = "bonnie",
            )
        userRepository.create(userB)

        val userC =
            UserMocks.getUser(
                id = userId2,
                firstName = "Carl",
                surname = "Carlson",
                email = "SharedName",
            )
        userRepository.create(userC)

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)

        val items = parsedResult.items
        assertEquals(3, items.size)
        assertEquals(userC.id.value, items[0].id)
        assertEquals(userB.id.value, items[1].id)
        assertEquals(userA.id.value, items[2].id)
    }

    @Test
    fun `List - Returns paginated list of users sorted by firstname asc with after cursor`() {
        val userA =
            UserMocks.getUser(
                id = userId0,
                firstName = "Aaron",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userA)

        val userB =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bonnie",
                surname = "Brown",
                email = "bonnie",
            )
        userRepository.create(userB)

        val userC =
            UserMocks.getUser(
                id = userId2,
                firstName = "Carl",
                surname = "Carlson",
                email = "carl",
            )
        userRepository.create(userC)

        val userD =
            UserMocks.getUser(
                id = userId3,
                firstName = "Diego",
                surname = "Donut",
                email = "diego",
            )
        userRepository.create(userD)

        // Paginate after userB
        val cursor =
            "{" +
                "  \"firstName\": \"${userB.firstName}\",\n" +
                "  \"id\": \"${userB.id.value}\"" +
                "}"

        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray())

        val result =
            mockMvc
                .perform(
                    get("$USERS_URL?limit=3&orderBy=firstName&after=$encodedCursor")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)
        assertNotNull(parsedResult.pageMetadata.prevPageBefore)

        assertNull(parsedResult.pageMetadata.nextPageAfter)

        val items = parsedResult.items
        assertEquals(2, items.size)
        assertEquals(userC.id.value, items[0].id)
        assertEquals(userD.id.value, items[1].id)
    }

    @Test
    fun `List - Returns paginated list of users sorted by firstname & name asc with after cursor`() {
        val userAA =
            UserMocks.getUser(
                id = userId0,
                firstName = "Aaron",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userAA)

        val userBA =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bob",
                surname = "Adams",
                email = "boba",
            )
        userRepository.create(userBA)

        val userBB =
            UserMocks.getUser(
                id = userId2,
                firstName = "Bob",
                surname = "Bobson",
                email = "bob",
            )
        userRepository.create(userBB)

        val userCC =
            UserMocks.getUser(
                id = userId3,
                firstName = "Carl",
                surname = "Carlson",
                email = "carlos",
            )
        userRepository.create(userCC)

        // Paginate after userAA
        val cursor =
            "{" +
                "  \"firstName\": \"${userAA.firstName}\",\n" +
                "  \"surname\": \"${userAA.surname}\",\n" +
                "  \"id\": \"${userAA.id.value}\"" +
                "}"

        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray())

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("limit", "2")
                        .param("orderBy", "firstName,surname")
                        .param("after", encodedCursor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)
        assertNotNull(parsedResult.pageMetadata.prevPageBefore)
        assertNotNull(parsedResult.pageMetadata.nextPageAfter)

        val items = parsedResult.items
        assertEquals(2, items.size)
        assertEquals(userBA.id.value, items[0].id)
        assertEquals(userBB.id.value, items[1].id)
    }

    @Test
    fun `List - Returns paginated list of users sorted by firstname desc with after cursor`() {
        val userA =
            UserMocks.getUser(
                id = userId0,
                firstName = "Aaron",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userA)

        val userB =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bonnie",
                surname = "Brown",
                email = "bonnie",
            )
        userRepository.create(userB)

        val userC =
            UserMocks.getUser(
                id = userId2,
                firstName = "Carl",
                surname = "Carlson",
                email = "carl",
            )
        userRepository.create(userC)

        val userD =
            UserMocks.getUser(
                id = userId3,
                firstName = "Diego",
                surname = "Donut",
                email = "diego",
            )
        userRepository.create(userD)

        // Paginate after userB
        val cursor =
            "{" +
                "  \"firstName\": \"${userB.firstName}\",\n" +
                "  \"id\": \"${userB.id.value}\"" +
                "}"

        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray())

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("limit", "3")
                        .param("orderBy", "-firstName")
                        .param("after", encodedCursor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)
        assertNotNull(parsedResult.pageMetadata.prevPageBefore)

        assertNull(parsedResult.pageMetadata.nextPageAfter)

        val items = parsedResult.items
        assertEquals(1, items.size)
        assertEquals(userA.id.value, items[0].id)
    }

    @Test
    fun `List - Returns paginated list of users sorted by firstname & name desc with after cursor`() {
        val userAA =
            UserMocks.getUser(
                id = userId0,
                firstName = "Aaron",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userAA)

        val userBA =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bob",
                surname = "Adams",
                email = "boba",
            )
        userRepository.create(userBA)

        val userBB =
            UserMocks.getUser(
                id = userId2,
                firstName = "Bob",
                surname = "Bobson",
                email = "bob",
            )
        userRepository.create(userBB)

        val userCC =
            UserMocks.getUser(
                id = userId3,
                firstName = "Carl",
                surname = "Carlson",
                email = "carlos",
            )
        userRepository.create(userCC)

        // Paginate after userCC
        val cursor =
            "{" +
                "  \"firstName\": \"${userCC.firstName}\",\n" +
                "  \"surname\": \"${userCC.surname}\",\n" +
                "  \"id\": \"${userCC.id.value}\"" +
                "}"

        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray())

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("limit", "2")
                        .param("orderBy", "-firstName,-surname")
                        .param("after", encodedCursor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)
        assertNotNull(parsedResult.pageMetadata.prevPageBefore)
        assertNotNull(parsedResult.pageMetadata.nextPageAfter)

        val items = parsedResult.items
        assertEquals(2, items.size)
        assertEquals(userBB.id.value, items[0].id)
        assertEquals(userBA.id.value, items[1].id)
    }

    @Test
    fun `List - Returns paginated list of users sorted by firstname asc & name desc with after cursor`() {
        val userAA =
            UserMocks.getUser(
                id = userId0,
                firstName = "Aaron",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userAA)

        val userBA =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bob",
                surname = "Adams",
                email = "boba",
            )
        userRepository.create(userBA)

        val userBB =
            UserMocks.getUser(
                id = userId2,
                firstName = "Bob",
                surname = "Bobson",
                email = "bob",
            )
        userRepository.create(userBB)

        val userCC =
            UserMocks.getUser(
                id = userId3,
                firstName = "Carl",
                surname = "Carlson",
                email = "carlos",
            )
        userRepository.create(userCC)

        // Paginate after userAA
        val cursor =
            "{" +
                "  \"firstName\": \"${userAA.firstName}\",\n" +
                "  \"surname\": \"${userAA.surname}\",\n" +
                "  \"id\": \"${userAA.id.value}\"" +
                "}"

        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray())

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("limit", "2")
                        .param("orderBy", "firstName,-surname")
                        .param("after", encodedCursor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)
        assertNotNull(parsedResult.pageMetadata.prevPageBefore)
        assertNotNull(parsedResult.pageMetadata.nextPageAfter)

        val items = parsedResult.items
        assertEquals(2, items.size)
        assertEquals(userBB.id.value, items[0].id)
        assertEquals(userBA.id.value, items[1].id)
    }

    @Test
    fun `List - Returns paginated list of users sorted by firstname desc & name asc with after cursor`() {
        val userAA =
            UserMocks.getUser(
                id = userId0,
                firstName = "Aaron",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userAA)

        val userBA =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bob",
                surname = "Adams",
                email = "boba",
            )
        userRepository.create(userBA)

        val userBB =
            UserMocks.getUser(
                id = userId2,
                firstName = "Bob",
                surname = "Bobson",
                email = "bob",
            )
        userRepository.create(userBB)

        val userCC =
            UserMocks.getUser(
                id = userId3,
                firstName = "Carl",
                surname = "Carlson",
                email = "carlos",
            )
        userRepository.create(userCC)

        // Paginate after userCC
        val cursor =
            "{" +
                "  \"firstName\": \"${userCC.firstName}\",\n" +
                "  \"surname\": \"${userCC.surname}\",\n" +
                "  \"id\": \"${userCC.id.value}\"" +
                "}"

        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray())

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("limit", "2")
                        .param("orderBy", "-firstName,surname")
                        .param("after", encodedCursor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)
        assertNotNull(parsedResult.pageMetadata.prevPageBefore)
        assertNotNull(parsedResult.pageMetadata.nextPageAfter)

        val items = parsedResult.items
        assertEquals(2, items.size)
        assertEquals(userBA.id.value, items[0].id)
        assertEquals(userBB.id.value, items[1].id)
    }

    @Test
    fun `List - Returns paginated list of users sorted by firstname & name asc when same firstname & name with after cursor`() {
        val userAA =
            UserMocks.getUser(
                id = userId0,
                firstName = "Aaron",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userAA)

        val userBA1 =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bob",
                surname = "Adams",
                email = "boba",
            )
        userRepository.create(userBA1)

        val userBA2 =
            UserMocks.getUser(
                id = userId2,
                firstName = "Bob",
                surname = "Adams",
                email = "bob",
            )
        userRepository.create(userBA2)

        val userCC =
            UserMocks.getUser(
                id = userId3,
                firstName = "Carl",
                surname = "Carlson",
                email = "carlos",
            )
        userRepository.create(userCC)

        // Paginate after userAA
        val cursor =
            "{" +
                "  \"firstName\": \"${userAA.firstName}\",\n" +
                "  \"surname\": \"${userAA.surname}\",\n" +
                "  \"id\": \"${userAA.id.value}\"" +
                "}"

        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray())

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("limit", "2")
                        .param("orderBy", "firstName,surname")
                        .param("after", encodedCursor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)
        assertNotNull(parsedResult.pageMetadata.prevPageBefore)
        assertNotNull(parsedResult.pageMetadata.nextPageAfter)

        val items = parsedResult.items
        assertEquals(2, items.size)
        assertEquals(userBA1.id.value, items[0].id)
        assertEquals(userBA2.id.value, items[1].id)
    }

    @Test
    fun `List - Returns paginated list of users sorted by firstname & name desc when same firstname & name with after cursor`() {
        val userAA =
            UserMocks.getUser(
                id = userId0,
                firstName = "Aaron",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userAA)

        val userBA1 =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bob",
                surname = "Adams",
                email = "boba",
            )
        userRepository.create(userBA1)

        val userBA2 =
            UserMocks.getUser(
                id = userId2,
                firstName = "Bob",
                surname = "Adams",
                email = "bob",
            )
        userRepository.create(userBA2)

        val userCC =
            UserMocks.getUser(
                id = userId3,
                firstName = "Carl",
                surname = "Carlson",
                email = "carlos",
            )
        userRepository.create(userCC)

        // Paginate after userAA
        val cursor =
            "{" +
                "  \"firstName\": \"${userCC.firstName}\",\n" +
                "  \"surname\": \"${userCC.surname}\",\n" +
                "  \"id\": \"${userCC.id.value}\"" +
                "}"

        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray())

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("limit", "2")
                        .param("orderBy", "-firstName,-surname")
                        .param("after", encodedCursor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)
        assertNotNull(parsedResult.pageMetadata.prevPageBefore)
        assertNotNull(parsedResult.pageMetadata.nextPageAfter)

        val items = parsedResult.items
        assertEquals(2, items.size)
        assertEquals(userBA1.id.value, items[0].id)
        assertEquals(userBA2.id.value, items[1].id)
    }

    @Test
    fun `List - Returns paginated list of users sorted by firstname asc with before cursor`() {
        val userA =
            UserMocks.getUser(
                id = userId0,
                firstName = "Aaron",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userA)

        val userB =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bonnie",
                surname = "Brown",
                email = "bonnie",
            )
        userRepository.create(userB)

        val userC =
            UserMocks.getUser(
                id = userId2,
                firstName = "Carl",
                surname = "Carlson",
                email = "carl",
            )
        userRepository.create(userC)

        val userD =
            UserMocks.getUser(
                id = userId3,
                firstName = "Diego",
                surname = "Donut",
                email = "diego",
            )
        userRepository.create(userD)

        // Paginate before userD
        val cursor =
            "{" +
                "  \"firstName\": \"${userD.firstName}\",\n" +
                "  \"id\": \"${userD.id.value}\"" +
                "}"

        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray())

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("limit", "2")
                        .param("orderBy", "firstName")
                        .param("before", encodedCursor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)
        assertNotNull(parsedResult.pageMetadata.prevPageBefore)
        assertNotNull(parsedResult.pageMetadata.nextPageAfter)

        val items = parsedResult.items
        assertEquals(2, items.size)
        assertEquals(userB.id.value, items[0].id)
        assertEquals(userC.id.value, items[1].id)
    }

    @Test
    fun `List - Returns paginated list of users sorted by firstname & name asc with before cursor`() {
        val userAA =
            UserMocks.getUser(
                id = userId0,
                firstName = "Aaron",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userAA)

        val userBA =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bob",
                surname = "Adams",
                email = "boba",
            )
        userRepository.create(userBA)

        val userBB =
            UserMocks.getUser(
                id = userId2,
                firstName = "Bob",
                surname = "Bobson",
                email = "bob",
            )
        userRepository.create(userBB)

        val userCC =
            UserMocks.getUser(
                id = userId3,
                firstName = "Carl",
                surname = "Carlson",
                email = "carlos",
            )
        userRepository.create(userCC)

        // Paginate before userBB
        val cursor =
            "{" +
                "  \"firstName\": \"${userBB.firstName}\",\n" +
                "  \"surname\": \"${userBB.surname}\",\n" +
                "  \"id\": \"${userBB.id.value}\"" +
                "}"

        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray())

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("limit", "2")
                        .param("orderBy", "firstName,surname")
                        .param("before", encodedCursor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)
        assertNotNull(parsedResult.pageMetadata.nextPageAfter)

        assertNull(parsedResult.pageMetadata.prevPageBefore)

        val items = parsedResult.items
        assertEquals(2, items.size)
        assertEquals(userAA.id.value, items[0].id)
        assertEquals(userBA.id.value, items[1].id)
    }

    @Test
    fun `List - Returns paginated list of users sorted by firstname desc with before cursor`() {
        val userA =
            UserMocks.getUser(
                id = userId0,
                firstName = "Aaron",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userA)

        val userB =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bonnie",
                surname = "Brown",
                email = "bonnie",
            )
        userRepository.create(userB)

        val userC =
            UserMocks.getUser(
                id = userId2,
                firstName = "Carl",
                surname = "Carlson",
                email = "carl",
            )
        userRepository.create(userC)

        val userD =
            UserMocks.getUser(
                id = userId3,
                firstName = "Diego",
                surname = "Donut",
                email = "diego",
            )
        userRepository.create(userD)

        // Paginate before userB
        val cursor =
            "{" +
                "  \"firstName\": \"${userB.firstName}\",\n" +
                "  \"id\": \"${userB.id.value}\"" +
                "}"

        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray())

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("limit", "3")
                        .param("orderBy", "-firstName")
                        .param("before", encodedCursor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)
        assertNotNull(parsedResult.pageMetadata.nextPageAfter)

        assertNull(parsedResult.pageMetadata.prevPageBefore)

        val items = parsedResult.items
        assertEquals(2, items.size)
        assertEquals(userD.id.value, items[0].id)
        assertEquals(userC.id.value, items[1].id)
    }

    @Test
    fun `List - Returns paginated list of users sorted by firstname & name desc with before cursor`() {
        val userAA =
            UserMocks.getUser(
                id = userId0,
                firstName = "Aaron",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userAA)

        val userBA =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bob",
                surname = "Adams",
                email = "boba",
            )
        userRepository.create(userBA)

        val userBB =
            UserMocks.getUser(
                id = userId2,
                firstName = "Bob",
                surname = "Bobson",
                email = "bob",
            )
        userRepository.create(userBB)

        val userCC =
            UserMocks.getUser(
                id = userId3,
                firstName = "Carl",
                surname = "Carlson",
                email = "carlos",
            )
        userRepository.create(userCC)

        // Paginate before userAA
        val cursor =
            "{" +
                "  \"firstName\": \"${userAA.firstName}\",\n" +
                "  \"surname\": \"${userAA.surname}\",\n" +
                "  \"id\": \"${userAA.id.value}\"" +
                "}"

        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray())

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("limit", "2")
                        .param("orderBy", "-firstName,-surname")
                        .param("before", encodedCursor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)
        assertNotNull(parsedResult.pageMetadata.prevPageBefore)
        assertNotNull(parsedResult.pageMetadata.nextPageAfter)

        val items = parsedResult.items
        assertEquals(2, items.size)
        assertEquals(userBB.id.value, items[0].id)
        assertEquals(userBA.id.value, items[1].id)
    }

    @Test
    fun `List - Returns paginated list of users sorted by firstname asc & name desc with before cursor`() {
        val userAA =
            UserMocks.getUser(
                id = userId0,
                firstName = "Aaron",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userAA)

        val userBA =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bob",
                surname = "Adams",
                email = "boba",
            )
        userRepository.create(userBA)

        val userBB =
            UserMocks.getUser(
                id = userId2,
                firstName = "Bob",
                surname = "Bobson",
                email = "bob",
            )
        userRepository.create(userBB)

        val userCC =
            UserMocks.getUser(
                id = userId3,
                firstName = "Carl",
                surname = "Carlson",
                email = "carlos",
            )
        userRepository.create(userCC)

        // Paginate before userCC
        val cursor =
            "{" +
                "  \"firstName\": \"${userCC.firstName}\",\n" +
                "  \"surname\": \"${userCC.surname}\",\n" +
                "  \"id\": \"${userCC.id.value}\"" +
                "}"

        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray())

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("limit", "2")
                        .param("orderBy", "firstName,-surname")
                        .param("before", encodedCursor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)
        assertNotNull(parsedResult.pageMetadata.prevPageBefore)
        assertNotNull(parsedResult.pageMetadata.nextPageAfter)

        val items = parsedResult.items
        assertEquals(2, items.size)
        assertEquals(userBB.id.value, items[0].id)
        assertEquals(userBA.id.value, items[1].id)
    }

    @Test
    fun `List - Returns paginated list of users sorted by firstname desc & name asc with before cursor`() {
        val userAA =
            UserMocks.getUser(
                id = userId0,
                firstName = "Aaron",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userAA)

        val userBA =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bob",
                surname = "Adams",
                email = "boba",
            )
        userRepository.create(userBA)

        val userBB =
            UserMocks.getUser(
                id = userId2,
                firstName = "Bob",
                surname = "Bobson",
                email = "bob",
            )
        userRepository.create(userBB)

        val userCC =
            UserMocks.getUser(
                id = userId3,
                firstName = "Carl",
                surname = "Carlson",
                email = "carlos",
            )
        userRepository.create(userCC)

        // Paginate before userAA
        val cursor =
            "{" +
                "  \"firstName\": \"${userAA.firstName}\",\n" +
                "  \"surname\": \"${userAA.surname}\",\n" +
                "  \"id\": \"${userAA.id.value}\"" +
                "}"

        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray())

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("limit", "2")
                        .param("orderBy", "-firstName,surname")
                        .param("before", encodedCursor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)
        assertNotNull(parsedResult.pageMetadata.prevPageBefore)
        assertNotNull(parsedResult.pageMetadata.nextPageAfter)

        val items = parsedResult.items
        assertEquals(2, items.size)
        assertEquals(userBA.id.value, items[0].id)
        assertEquals(userBB.id.value, items[1].id)
    }

    @Test
    fun `List - Returns paginated list of users sorted by firstname & name asc when same firstname & name with before cursor`() {
        val userAA =
            UserMocks.getUser(
                id = userId0,
                firstName = "Aaron",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userAA)

        val userBA1 =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bob",
                surname = "Adams",
                email = "boba",
            )
        userRepository.create(userBA1)

        val userBA2 =
            UserMocks.getUser(
                id = userId2,
                firstName = "Bob",
                surname = "Adams",
                email = "bob",
            )
        userRepository.create(userBA2)

        val userCC =
            UserMocks.getUser(
                id = userId3,
                firstName = "Carl",
                surname = "Carlson",
                email = "carlos",
            )
        userRepository.create(userCC)

        // Paginate before userCC
        val cursor =
            "{" +
                "  \"firstName\": \"${userCC.firstName}\",\n" +
                "  \"surname\": \"${userCC.surname}\",\n" +
                "  \"id\": \"${userCC.id.value}\"" +
                "}"

        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray())

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("limit", "2")
                        .param("orderBy", "firstName,surname")
                        .param("before", encodedCursor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)
        assertNotNull(parsedResult.pageMetadata.prevPageBefore)
        assertNotNull(parsedResult.pageMetadata.nextPageAfter)

        val items = parsedResult.items
        assertEquals(2, items.size)
        assertEquals(userBA1.id.value, items[0].id)
        assertEquals(userBA2.id.value, items[1].id)
    }

    @Test
    fun `List - Returns paginated list of users sorted by firstname & name desc when same firstname & name with before cursor`() {
        val userAA =
            UserMocks.getUser(
                id = userId0,
                firstName = "Aaron",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userAA)

        val userBA1 =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bob",
                surname = "Adams",
                email = "boba",
            )
        userRepository.create(userBA1)

        val userBA2 =
            UserMocks.getUser(
                id = userId2,
                firstName = "Bob",
                surname = "Adams",
                email = "bob",
            )
        userRepository.create(userBA2)

        val userCC =
            UserMocks.getUser(
                id = userId3,
                firstName = "Carl",
                surname = "Carlson",
                email = "carlos",
            )
        userRepository.create(userCC)

        // Paginate before userAA
        val cursor =
            "{" +
                "  \"firstName\": \"${userAA.firstName}\",\n" +
                "  \"surname\": \"${userAA.surname}\",\n" +
                "  \"id\": \"${userAA.id.value}\"" +
                "}"

        val encodedCursor = Base64.getEncoder().encodeToString(cursor.toByteArray())

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("limit", "2")
                        .param("orderBy", "-firstName,-surname")
                        .param("before", encodedCursor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)
        assertNotNull(parsedResult.pageMetadata.prevPageBefore)
        assertNotNull(parsedResult.pageMetadata.nextPageAfter)

        val items = parsedResult.items
        assertEquals(2, items.size)
        assertEquals(userBA1.id.value, items[0].id)
        assertEquals(userBA2.id.value, items[1].id)
    }

    @Test
    fun `List - Returns paginated list of users sorted by firstname asc first page`() {
        val userA =
            UserMocks.getUser(
                id = userId0,
                firstName = "Aaron",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userA)

        val userB =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bonnie",
                surname = "Brown",
                email = "bonnie",
            )
        userRepository.create(userB)

        val userC =
            UserMocks.getUser(
                id = userId2,
                firstName = "Carl",
                surname = "Carlson",
                email = "carl",
            )
        userRepository.create(userC)

        val userD =
            UserMocks.getUser(
                id = userId3,
                firstName = "Diego",
                surname = "Donut",
                email = "diego",
            )
        userRepository.create(userD)

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("limit", "2")
                        .param("orderBy", "firstName")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)
        assertNotNull(parsedResult.pageMetadata.nextPageAfter)

        assertNull(parsedResult.pageMetadata.prevPageBefore)

        val items = parsedResult.items
        assertEquals(2, items.size)
        assertEquals(userA.id.value, items[0].id)
        assertEquals(userB.id.value, items[1].id)
    }

    @Test
    fun `List - Returns paginated list of users sorted by firstname asc last page`() {
        val userA =
            UserMocks.getUser(
                id = userId0,
                firstName = "Aaron",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userA)

        val userB =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bonnie",
                surname = "Brown",
                email = "bonnie",
            )
        userRepository.create(userB)

        val userC =
            UserMocks.getUser(
                id = userId2,
                firstName = "Carl",
                surname = "Carlson",
                email = "carl",
            )
        userRepository.create(userC)

        val userD =
            UserMocks.getUser(
                id = userId3,
                firstName = "Diego",
                surname = "Donut",
                email = "diego",
            )
        userRepository.create(userD)

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("limit", "2")
                        .param("orderBy", "firstName")
                        .param("before", "lastPage")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)
        assertNotNull(parsedResult.pageMetadata.prevPageBefore)

        assertNull(parsedResult.pageMetadata.nextPageAfter)

        val items = parsedResult.items
        assertEquals(2, items.size)
        assertEquals(userC.id.value, items[0].id)
        assertEquals(userD.id.value, items[1].id)
    }

    @Test
    fun `List - Returns paginated list of users sorted by email asc`() {
        val userAdmin =
            UserMocks.getUser(
                id = userId0,
                firstName = "Aaron",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userAdmin)

        val userSupervisor =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bonnie",
                surname = "Brown",
                email = "bonnie",
            )
        userRepository.create(userSupervisor)

        val userOperator =
            UserMocks.getUser(
                id = userId2,
                firstName = "Carl",
                surname = "Carlson",
                email = "carl",
            )
        userRepository.create(userOperator)

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("limit", "3")
                        .param("orderBy", "email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)
        assertNull(parsedResult.pageMetadata.nextPageAfter)
        assertNull(parsedResult.pageMetadata.prevPageBefore)

        val items = parsedResult.items
        assertEquals(3, items.size)
        assertEquals(userAdmin.id.value, items[0].id)
        assertEquals(userSupervisor.id.value, items[1].id)
        assertEquals(userOperator.id.value, items[2].id)
    }

    @Test
    fun `List - Returns paginated list of users sorted by email desc`() {
        val userAdmin =
            UserMocks.getUser(
                id = userId0,
                firstName = "Aaron",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userAdmin)

        val userSupervisor =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bonnie",
                surname = "Brown",
                email = "bonnie",
            )
        userRepository.create(userSupervisor)

        val userOperator =
            UserMocks.getUser(
                id = userId2,
                firstName = "Carl",
                surname = "Carlson",
                email = "carl",
            )
        userRepository.create(userOperator)

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("limit", "3")
                        .param("orderBy", "-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)

        assertNull(parsedResult.pageMetadata.nextPageAfter)
        assertNull(parsedResult.pageMetadata.prevPageBefore)

        val items = parsedResult.items
        assertEquals(3, items.size)
        assertEquals(userOperator.id.value, items[0].id)
        assertEquals(userSupervisor.id.value, items[1].id)
        assertEquals(userAdmin.id.value, items[2].id)
    }

    @Test
    fun `List - Returns paginated list of users`() {
        val userAdmin =
            UserMocks.getUser(
                id = userId0,
                firstName = "Aaron",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userAdmin)

        val userSupervisor =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bonnie",
                surname = "Brown",
                email = "bonnie",
            )
        userRepository.create(userSupervisor)

        val userOperator =
            UserMocks.getUser(
                id = userId3,
                firstName = "Carl",
                surname = "Carlson",
                email = "carl",
            )
        userRepository.create(userOperator)
    }

    @Test
    fun `List - Returns paginated list of users filtered by first name`() {
        val userA =
            UserMocks.getUser(
                id = userId0,
                firstName = "Arley",
                surname = "Arnolds",
                email = "arnolds",
            )
        userRepository.create(userA)

        val userB =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bonnie",
                surname = "Brown",
                email = "bonnie",
            )
        userRepository.create(userB)

        val userC =
            UserMocks.getUser(
                id = userId3,
                firstName = "Carl",
                surname = "Carlson",
                email = "carl",
            )
        userRepository.create(userC)

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("search", "arl")
                        .param("orderBy", "firstName")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)

        val items = parsedResult.items
        assertEquals(2, items.size)
        assertEquals(userA.id.value, items[0].id)
        assertEquals(userC.id.value, items[1].id)
    }

    @Test
    fun `List - Returns paginated list of users filtered by name`() {
        val userA =
            UserMocks.getUser(
                id = userId0,
                firstName = "Aaron",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userA)

        val userB =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bonnie",
                surname = "Brown",
                email = "bonnie",
            )
        userRepository.create(userB)

        val userC =
            UserMocks.getUser(
                id = userId3,
                firstName = "Carl",
                surname = "Carlson",
                email = "carl",
            )
        userRepository.create(userC)

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("search", "own")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)

        val items = parsedResult.items
        assertEquals(1, items.size)
        assertEquals(userB.id.value, items[0].id)
    }

    @Test
    fun `List - Returns paginated list of users filtered by login name`() {
        val userA =
            UserMocks.getUser(
                id = userId0,
                firstName = "Aaron",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userA)

        val userB =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bonnie",
                surname = "Brown",
                email = "bonnie123",
            )
        userRepository.create(userB)

        val userC =
            UserMocks.getUser(
                id = userId3,
                firstName = "Carl",
                surname = "Carlson",
                email = "carl",
            )
        userRepository.create(userC)

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("search", "123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)

        val items = parsedResult.items
        assertEquals(1, items.size)
        assertEquals(userB.id.value, items[0].id)
    }

    @Test
    fun `List - Returns paginated list of users filtered by multiple fields`() {
        val userA =
            UserMocks.getUser(
                id = userId0,
                firstName = "SharedName",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userA)

        val userB =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bonnie",
                surname = "SharedName",
                email = "bonnie",
            )
        userRepository.create(userB)

        val userC =
            UserMocks.getUser(
                id = userId3,
                firstName = "Carl",
                surname = "Carlson",
                email = "SharedName",
            )
        userRepository.create(userC)

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("search", "shared")
                        .param("orderBy", "email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)

        val items = parsedResult.items
        assertEquals(3, items.size)
        assertEquals(userA.id.value, items[0].id)
        assertEquals(userB.id.value, items[1].id)
        assertEquals(userC.id.value, items[2].id)
    }

    @Test
    fun `List - Returns paginated list of users filtered by first name & name`() {
        val userA =
            UserMocks.getUser(
                id = userId0,
                firstName = "Aaron",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userA)

        val userB =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bonnie",
                surname = "Arnolds",
                email = "bonnie",
            )
        userRepository.create(userB)

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("search", "aaron arn")
                        .param("orderBy", "email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)

        val items = parsedResult.items
        assertEquals(1, items.size)
        assertEquals(userA.id.value, items[0].id)
    }

    @Test
    fun `List - Returns paginated list of users filtered by name & first name`() {
        val userA =
            UserMocks.getUser(
                id = userId0,
                firstName = "Aaron",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userA)

        val userB =
            UserMocks.getUser(
                id = userId1,
                firstName = "Bonnie",
                surname = "Arnolds",
                email = "bonnie",
            )
        userRepository.create(userB)

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("search", "arnolds aar")
                        .param("orderBy", "email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)

        val items = parsedResult.items
        assertEquals(1, items.size)
        assertEquals(userA.id.value, items[0].id)
    }

    @Test
    fun `List - Returns paginated list of users filtered by name not unaccented`() {
        val userA =
            UserMocks.getUser(
                id = userId0,
                firstName = "Jiří",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userA)

        val userB =
            UserMocks.getUser(
                id = userId1,
                firstName = "Zuzana",
                surname = "Arnolds",
                email = "bonnie",
            )
        userRepository.create(userB)

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("search", "jiří")
                        .param("orderBy", "firstName")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)

        val items = parsedResult.items
        assertEquals(1, items.size)
        assertEquals(userA.id.value, items[0].id)
    }

    @Test
    fun `List - Returns paginated list of users filtered by name unaccented`() {
        val userA =
            UserMocks.getUser(
                id = userId0,
                firstName = "Jiří",
                surname = "Arnolds",
                email = "aaron",
            )
        userRepository.create(userA)

        val userB =
            UserMocks.getUser(
                id = userId1,
                firstName = "Zuzana",
                surname = "Arnolds",
                email = "bonnie",
            )
        userRepository.create(userB)

        val result =
            mockMvc
                .perform(
                    get(USERS_URL)
                        .param("search", "jiri")
                        .param("orderBy", "firstName")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(AuthMocks.mockAdmin()),
                ).andExpect(status().isOk)
                .andReturn()

        val parsedResult = readResponse<UserPaginatedResponseDto>(result)

        assertNotNull(parsedResult.items)
        assertNotNull(parsedResult.pageMetadata)

        val items = parsedResult.items
        assertEquals(1, items.size)
        assertEquals(userA.id.value, items[0].id)
    }
}

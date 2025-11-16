package cz.vokounova.configurator.users.api.dto

import cz.vokounova.configurator.users.domain.User
import java.time.OffsetDateTime

data class UserDto(
    val id: UserIdDto,
    val firstName: String,
    val surname: String,
    val email: String,
    val createdAt: OffsetDateTime,
    val modifiedAt: OffsetDateTime,
    val password: String,
    val checksum: String,
) {
    companion object {
        fun fromDomain(domain: User) =
            UserDto(
                id = UserIdDto.fromDomain(domain.id),
                firstName = domain.firstName,
                surname = domain.surname,
                email = domain.email,
                createdAt = domain.createdAt,
                modifiedAt = domain.modifiedAt,
                password = domain.password,
                checksum = domain.checkSum,
            )
    }

    fun toDomain(): User =
        User(
            id = id.toDomain(),
            firstName = firstName,
            email = email,
            surname = surname,
            password = password,
            createdAt = createdAt,
            modifiedAt = modifiedAt,
            checkSum = checksum,
        )

    fun fullName(): String = "$firstName $surname"
}

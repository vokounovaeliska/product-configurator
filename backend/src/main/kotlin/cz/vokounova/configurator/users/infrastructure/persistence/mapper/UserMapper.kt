package cz.vokounova.configurator.users.infrastructure.persistence.mapper

import cz.vokounova.configurator.generated.jooq.tables.records.UserRecord
import cz.vokounova.configurator.users.domain.User
import cz.vokounova.configurator.users.domain.UserId

fun User.toPersistence(): UserRecord =
    UserRecord(
        id = id.value,
        firstName = firstName,
        surname = surname,
        email = email,
        supplierNotificationEmail = supplierNotificationEmail,
        password = password,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
        checkSum = checkSum,
    )

fun UserRecord.toDomain(): User =
    User(
        id = UserId(id),
        firstName = firstName,
        surname = surname,
        email = email,
        supplierNotificationEmail = supplierNotificationEmail,
        password = password,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
        checkSum = checkSum,
    )

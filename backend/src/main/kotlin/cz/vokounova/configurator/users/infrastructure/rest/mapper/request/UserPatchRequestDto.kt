package cz.vokounova.configurator.users.infrastructure.rest.mapper.request

data class UserPatchRequestDto(
    val path: Path,
    val value: Any?,
    val op: Op,
) {
    enum class Path {
        SlashFirstName,
        SlashSurname,
        SlashEmail,
        SlashSupplierNotificationEmail,
        SlashIsActive,
    }

    enum class Op {
        Replace,
    }
}

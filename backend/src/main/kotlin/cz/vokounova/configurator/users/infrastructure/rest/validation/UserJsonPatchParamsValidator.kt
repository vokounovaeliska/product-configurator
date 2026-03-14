package cz.vokounova.configurator.users.infrastructure.rest.validation

import cz.vokounova.configurator.shared.exceptions.ValidationExceptionError
import cz.vokounova.configurator.shared.validations.AppValidator
import cz.vokounova.configurator.users.domain.UserJsonPatchParams
import cz.vokounova.configurator.users.domain.UserJsonPatchParamsPath
import org.springframework.stereotype.Component

@Component
class UserJsonPatchParamsValidator : AppValidator<UserJsonPatchParams> {
    companion object {
        private const val EMAIL_PATTERN = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$"
    }

    override fun validate(value: UserJsonPatchParams): List<ValidationExceptionError> =
        validation {
            when (val path = value.path) {
                UserJsonPatchParamsPath.FIRST_NAME,
                UserJsonPatchParamsPath.SURNAME,
                UserJsonPatchParamsPath.EMAIL,
                ->
                    field(path.value, value.value as? String) {
                        notNull()
                        notEmpty()
                    }

                UserJsonPatchParamsPath.NOTIFICATION_EMAIL -> {
                    if (value.value == null) {
                        return@validation
                    }

                    field(path.value, value.value as? String) {
                        notNull()
                        notEmpty()
                        matchPattern(EMAIL_PATTERN)
                    }
                }

                else ->
                    anyField(path.value, value.value) {
                        notNull()
                    }
            }
        }
}

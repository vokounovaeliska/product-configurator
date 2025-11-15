package cz.vokounova.configurator.users.infrastructure.rest.validation

import cz.vokounova.configurator.shared.exceptions.ValidationExceptionError
import cz.vokounova.configurator.shared.validations.AppValidator
import cz.vokounova.configurator.users.domain.UserJsonPatchParams
import cz.vokounova.configurator.users.domain.UserJsonPatchParamsPath
import org.springframework.stereotype.Component

@Component
class UserJsonPatchParamsValidator : AppValidator<UserJsonPatchParams> {
    override fun validate(value: UserJsonPatchParams): List<ValidationExceptionError> =
        validation {
            when (val path = value.path) {
                UserJsonPatchParamsPath.FIRST_NAME, UserJsonPatchParamsPath.EMAIL, UserJsonPatchParamsPath.EMAIL,
                ->
                    field(path.value, value.value as? String) {
                        notNull()
                        notEmpty()
                    }

                else ->
                    anyField(path.value, value.value) {
                        notNull()
                    }
            }
        }
}

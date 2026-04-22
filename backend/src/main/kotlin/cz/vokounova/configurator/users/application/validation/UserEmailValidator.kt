package cz.vokounova.configurator.users.application.validation

import cz.vokounova.configurator.shared.exceptions.ValidationExceptionError
import cz.vokounova.configurator.shared.validations.AppValidator
import cz.vokounova.configurator.shared.validations.BaseValidationCode
import cz.vokounova.configurator.users.domain.User
import cz.vokounova.configurator.users.domain.UserCreateParams
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.domain.UserJsonPatchParams
import cz.vokounova.configurator.users.domain.UserJsonPatchParamsPath
import cz.vokounova.configurator.users.ports.outbound.UserRepository
import org.springframework.stereotype.Component

data class UserEmailValidatorParams(
    val createParams: UserCreateParams? = null,
    val jsonPatchParams: List<UserJsonPatchParams>? = null,
    val existingUser: User? = null,
)

@Component
class UserEmailValidator(
    private val userRepository: UserRepository,
) : AppValidator<UserEmailValidatorParams> {
    override fun validate(value: UserEmailValidatorParams): List<ValidationExceptionError> =
        validation {
            value.createParams?.let {
                validateEmailUniqueness(it.email)?.let { addError(it) }
            }

            value.existingUser?.let { existing ->
                val newLoginEmail =
                    value.jsonPatchParams
                        ?.find { it.path == UserJsonPatchParamsPath.EMAIL }
                        ?.value as? String

                if (newLoginEmail != null && newLoginEmail != existing.email) {
                    validateEmailUniqueness(newLoginEmail, existing.id)?.let { addError(it) }
                }
            }
        }

    private fun validateEmailUniqueness(
        email: String,
        excludedUserId: UserId? = null,
    ): ValidationExceptionError? =
        ValidationExceptionError(
            code = BaseValidationCode.IS_NOT_UNIQUE.name,
            field = "email",
            message = "User email : $email is not unique",
        ).takeIf {
            userRepository.existsForEmail(email, excludedUserId)
        }
}

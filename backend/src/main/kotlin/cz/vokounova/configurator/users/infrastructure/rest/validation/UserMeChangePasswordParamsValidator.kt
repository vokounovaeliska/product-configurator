package cz.vokounova.configurator.users.infrastructure.rest.validation

import cz.vokounova.configurator.shared.exceptions.ValidationExceptionError
import cz.vokounova.configurator.shared.validations.AppValidator
import cz.vokounova.configurator.users.application.configuration.UserPasswordEncoder
import cz.vokounova.configurator.users.application.exception.UserValidationCode
import cz.vokounova.configurator.users.domain.User
import cz.vokounova.configurator.users.domain.UserMeChangePasswordParams
import org.springframework.stereotype.Component

@Component
class UserMeChangePasswordParamsValidator(
    private val encoder: UserPasswordEncoder,
) : AppValidator<UserMeChangePasswordParams> {
    override fun validate(value: UserMeChangePasswordParams): List<ValidationExceptionError> =
        validation {
            field("newPassword", value.newPassword) {
                matchPattern(User.PASSWORD_PATTERN)
                minLength(User.PASSWORD_LENGTH_MIN)
                maxLength(User.PASSWORD_LENGTH_MAX)
                matchField("confirmNewPassword", value.confirmNewPassword, UserValidationCode.PASSWORDS_NOT_MATCH.name)
            }
            field("confirmNewPassword", value.confirmNewPassword) {
                matchPattern(User.PASSWORD_PATTERN)
                minLength(User.PASSWORD_LENGTH_MIN)
                maxLength(User.PASSWORD_LENGTH_MAX)
            }

            field("oldPassword", value.oldPassword) {
                customValidation(
                    errorMessage = "Old password is invalid",
                    errorCode = UserValidationCode.PASSWORD_IS_INVALID.name,
                ) {
                    !encoder.matches(value.oldPassword, value.encodedOldPassword!!)
                }
            }
        }
}

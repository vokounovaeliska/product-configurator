package cz.vokounova.configurator.users.infrastructure.rest.validation

import cz.vokounova.configurator.shared.exceptions.ValidationExceptionError
import cz.vokounova.configurator.shared.validations.AppValidator
import cz.vokounova.configurator.users.application.exception.UserValidationCode
import cz.vokounova.configurator.users.domain.User
import cz.vokounova.configurator.users.domain.UserChangePasswordParams
import org.springframework.stereotype.Component

@Component
class UserChangePasswordParamsValidator : AppValidator<UserChangePasswordParams> {
    override fun validate(value: UserChangePasswordParams): List<ValidationExceptionError> =
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
        }
}

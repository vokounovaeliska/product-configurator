package cz.vokounova.configurator.users.infrastructure.rest.validation

import cz.vokounova.configurator.shared.exceptions.ValidationExceptionError
import cz.vokounova.configurator.shared.validations.AppValidator
import cz.vokounova.configurator.users.application.exception.UserValidationCode
import cz.vokounova.configurator.users.domain.User
import cz.vokounova.configurator.users.domain.UserCreateParams
import org.springframework.stereotype.Component

@Component
class UserCreateParamsValidator : AppValidator<UserCreateParams> {
    override fun validate(value: UserCreateParams): List<ValidationExceptionError> =
        validation {
            field("password", value.password) {
                matchPattern(User.PASSWORD_PATTERN)
                minLength(User.PASSWORD_LENGTH_MIN)
                maxLength(User.PASSWORD_LENGTH_MAX)
                matchField("confirmPassword", value.confirmPassword, UserValidationCode.PASSWORDS_NOT_MATCH.name)
            }
            field("confirmPassword", value.confirmPassword) {
                matchPattern(User.PASSWORD_PATTERN)
                minLength(User.PASSWORD_LENGTH_MIN)
                maxLength(User.PASSWORD_LENGTH_MAX)
            }
            field("firstName", value.firstName) {
                notNull()
                notEmpty()
            }
            field("surname", value.surname) {
                notNull()
                notEmpty()
            }
            field("email", value.email) {
                notNull()
                notEmpty()
            }
        }
}

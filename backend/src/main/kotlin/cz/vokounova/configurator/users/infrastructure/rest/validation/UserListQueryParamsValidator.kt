package cz.vokounova.configurator.users.infrastructure.rest.validation

import cz.vokounova.configurator.shared.exceptions.ValidationExceptionError
import cz.vokounova.configurator.shared.validations.AppValidator
import cz.vokounova.configurator.users.domain.UserSortingConfig
import cz.vokounova.configurator.users.infrastructure.rest.request.UserListQueryParams
import org.springframework.stereotype.Component

@Component
class UserListQueryParamsValidator : AppValidator<UserListQueryParams> {
    override fun validate(value: UserListQueryParams): List<ValidationExceptionError> =
        validation {
            value.orderBy?.let { list ->
                list.forEach {
                    field("orderBy", it) {
                        validOrderBy(UserSortingConfig)
                    }
                }
            }

            field("limit", value.limit) { min(1) }
        }
}

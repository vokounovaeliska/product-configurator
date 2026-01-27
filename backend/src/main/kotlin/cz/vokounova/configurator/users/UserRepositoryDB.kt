package cz.vokounova.configurator.users

import cz.vokounova.configurator.generated.jooq.tables.records.UserRecord
import cz.vokounova.configurator.generated.jooq.tables.references.USER
import cz.vokounova.configurator.shared.pagination.CursorCodec
import cz.vokounova.configurator.shared.pagination.FinalPageRequest
import cz.vokounova.configurator.shared.pagination.OrderBy
import cz.vokounova.configurator.shared.pagination.PageAfterRequest
import cz.vokounova.configurator.shared.pagination.PageBeforeRequest
import cz.vokounova.configurator.shared.pagination.PaginatedResult
import cz.vokounova.configurator.shared.pagination.PaginationRequest
import cz.vokounova.configurator.shared.pagination.jooq.FirstPageRequest
import cz.vokounova.configurator.shared.pagination.jooq.LastPageRequest
import cz.vokounova.configurator.shared.pagination.jooq.NextPageRequest
import cz.vokounova.configurator.shared.pagination.jooq.PageResult
import cz.vokounova.configurator.shared.pagination.jooq.PreviousPageRequest
import cz.vokounova.configurator.shared.pagination.jooq.useSeekPagination
import cz.vokounova.configurator.shared.persistence.jooq.PostgresFunctions
import cz.vokounova.configurator.shared.persistence.jooq.ignoreFields
import cz.vokounova.configurator.users.application.configuration.UserPasswordEncoder
import cz.vokounova.configurator.users.domain.User
import cz.vokounova.configurator.users.domain.UserFilter
import cz.vokounova.configurator.users.domain.UserId
import cz.vokounova.configurator.users.domain.UserSortableField
import cz.vokounova.configurator.users.domain.getChecksum
import cz.vokounova.configurator.users.infrastructure.persistence.mapper.toDomain
import cz.vokounova.configurator.users.infrastructure.persistence.mapper.toPersistence
import cz.vokounova.configurator.users.ports.outboud.UserRepository
import org.jooq.Condition
import org.jooq.DSLContext
import org.jooq.impl.DSL
import org.springframework.stereotype.Component
import java.time.OffsetDateTime

@Component
class UserRepositoryDB(
    private val dslContext: DSLContext,
    private val encoder: UserPasswordEncoder,
    private val cursorCodec: CursorCodec<UserPagination>,
) : UserRepository {
    override fun findByEmail(email: String): User? =
        dslContext
            .selectFrom(USER)
            .where(USER.EMAIL.eq(email))
            .fetchOne()
            ?.toDomain()

    override fun findById(
        id: UserId,
        lock: Boolean,
    ): User? =
        dslContext
            .selectFrom(USER)
            .where(USER.ID.eq(id.value))
            .run { if (lock) this.forUpdate() else this }
            .fetchOne()
            ?.toDomain()

    override fun findByFilter(filter: UserFilter?): List<User> =
        dslContext
            .selectFrom(USER)
            .apply {
                filter?.let {
                    where(buildFilterConditions(filter))
                }
            }.fetch()
            .map { it.toDomain() }

    override fun create(user: User): User? {
        val userWithEncodedPassword = user.copy(password = encoder.encode(user.password))
        val record =
            userWithEncodedPassword
                .copy(checkSum = userWithEncodedPassword.getChecksum())
                .toPersistence()
                .ignoreFields(USER.SEARCH_VECTOR)

        return dslContext
            .insertInto(USER)
            .set(record)
            .returning()
            .fetchOne()
            ?.toDomain()
    }

    override fun update(user: User): User? {
        val updatedUser = user.copy(modifiedAt = OffsetDateTime.now())
        val record =
            updatedUser
                .copy(checkSum = updatedUser.getChecksum())
                .toPersistence()
                .ignoreFields(USER.SEARCH_VECTOR)

        return dslContext
            .update(USER)
            .set(record)
            .where(USER.ID.eq(record.id))
            .returning()
            .fetchOne()
            ?.toDomain()
    }

    override fun updatePassword(user: User) {
        val updatedUser = user.copy(password = encoder.encode(user.password))
        update(updatedUser)
    }

    override fun delete(id: UserId): Int =
        dslContext
            .deleteFrom(USER)
            .where(USER.ID.eq(id.value))
            .execute()

    override fun deleteMultiple(ids: Set<UserId>): Int =
        dslContext
            .deleteFrom(USER)
            .where(USER.ID.`in`(ids.map { it.value }))
            .execute()

    override fun findByFilterPaginated(
        filter: UserFilter,
        paginationRequest: PaginationRequest<UserSortableField>,
    ): PaginatedResult<User> {
        val filterConditions = buildFilterConditions(filter)
        val pageRequest =
            when (paginationRequest) {
                is PageAfterRequest -> {
                    val pagination = cursorCodec.decode(paginationRequest.after, UserPagination::class.java)
                    NextPageRequest(
                        table = USER,
                        cursorFieldValues = pagination.toPaginationFieldsValueMap(),
                        orderFields = UserPagination.toOrderFields(paginationRequest.orderByFields),
                        filterConditions = filterConditions,
                        pageSize = paginationRequest.limit,
                    )
                }

                is PageBeforeRequest -> {
                    val pagination = cursorCodec.decode(paginationRequest.before, UserPagination::class.java)
                    PreviousPageRequest(
                        table = USER,
                        cursorFieldValues = pagination.toPaginationFieldsValueMap(),
                        orderFields = UserPagination.toOrderFields(paginationRequest.orderByFields),
                        filterConditions = filterConditions,
                        pageSize = paginationRequest.limit,
                    )
                }

                is FinalPageRequest -> {
                    LastPageRequest(
                        table = USER,
                        orderFields = UserPagination.toOrderFields(paginationRequest.orderByFields),
                        filterConditions = filterConditions,
                        pageSize = paginationRequest.limit,
                    )
                }

                else -> {
                    FirstPageRequest(
                        table = USER,
                        orderFields = UserPagination.toOrderFields(paginationRequest.orderByFields),
                        filterConditions = filterConditions,
                        pageSize = paginationRequest.limit,
                    )
                }
            }

        val page = dslContext.useSeekPagination().getPage(pageRequest)
        return getPaginatedResult(page, paginationRequest.orderByFields)
    }

    private fun getPaginatedResult(
        pageResult: PageResult<UserRecord>,
        usedOrderByFields: List<OrderBy<UserSortableField>>,
    ): PaginatedResult<User> {
        val data = pageResult.data.map { it.toDomain() }

        val cursorBefore =
            pageResult.before?.let {
                cursorCodec.encode(it.toPagination(usedOrderByFields))
            }
        val cursorAfter =
            pageResult.after?.let {
                cursorCodec.encode(it.toPagination(usedOrderByFields))
            }

        return PaginatedResult(
            data = data,
            pagesTotal = pageResult.pagesTotal,
            cursorBefore = cursorBefore,
            cursorAfter = cursorAfter,
        )
    }

    private fun buildFilterConditions(filter: UserFilter): List<Condition> {
        val conditions = mutableListOf<Condition>()

        filter.ids?.let { userIds ->
            conditions.add(
                USER.ID.`in`(userIds.map { it.value }),
            )
        }

        filter.search?.let { search ->
            conditions.add(
                USER.SEARCH_VECTOR.likeIgnoreCase(
                    DSL.function(PostgresFunctions.F_UNACCENT.value, String::class.java, DSL.inline("%$search%")),
                ),
            )
        }

        return conditions
    }

    override fun existsForEmail(
        email: String,
        excludeUserId: UserId?,
    ): Boolean {
        val query =
            dslContext
                .selectOne()
                .from(USER)
                .where(USER.EMAIL.eq(email))

        excludeUserId?.let { excludeId ->
            query.and(USER.ID.ne(excludeId.value))
        }

        return dslContext.fetchExists(query)
    }
}

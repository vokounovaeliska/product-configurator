package cz.vokounova.configurator.analytics.infrastructure.persistence

import cz.vokounova.configurator.analytics.domain.ConfiguratorAnalyticsEventRow
import cz.vokounova.configurator.analytics.domain.ConfiguratorAnalyticsEventType
import cz.vokounova.configurator.analytics.domain.ConfiguratorAnalyticsHeadline
import cz.vokounova.configurator.analytics.domain.ConfiguratorAnalyticsPerModelRow
import cz.vokounova.configurator.analytics.events.ports.outbound.ConfiguratorAnalyticsEventRepository
import cz.vokounova.configurator.generated.jooq.tables.ConfiguratorAnalyticsEvent
import cz.vokounova.configurator.generated.jooq.tables.references.CONFIGURATOR_ANALYTICS_EVENT
import cz.vokounova.configurator.generated.jooq.tables.references.CUSTOMER_REQUEST
import cz.vokounova.configurator.generated.jooq.tables.references.PRODUCT_MODEL
import org.jooq.DSLContext
import org.jooq.Field
import org.jooq.Table
import org.jooq.impl.DSL
import org.springframework.stereotype.Component
import java.time.OffsetDateTime
import java.util.UUID

@Component
class ConfiguratorAnalyticsEventRepositoryDB(
    private val dslContext: DSLContext,
) : ConfiguratorAnalyticsEventRepository {
    override fun insertEvents(rows: List<ConfiguratorAnalyticsEventRow>) {
        if (rows.isEmpty()) return
        val e = CONFIGURATOR_ANALYTICS_EVENT
        dslContext
            .insertInto(e)
            .columns(
                e.EVENT_TYPE,
                e.SESSION_ID,
                e.PRODUCT_MODEL_ID,
                e.EMBED_OWNER_USER_ID,
                e.EMBED_PRODUCT_URL,
                e.SURFACE,
                e.CUSTOMER_REQUEST_ID,
            )
            .valuesOfRows(
                rows.map { row ->
                    DSL.row(
                        row.eventType,
                        row.sessionId,
                        row.productModelId,
                        row.embedOwnerUserId,
                        row.embedProductUrl,
                        row.surface,
                        row.customerRequestId,
                    )
                },
            )
            .onConflictDoNothing()
            .execute()
    }

    /** Event metrics and lead count: two queries keep the SQL PostgreSQL-safe and avoid repeating metric definitions. */
    override fun loadHeadline(
        ownerId: UUID,
        productModelId: UUID,
        fromAt: OffsetDateTime,
        toAt: OffsetDateTime,
    ): ConfiguratorAnalyticsHeadline {
        val e = CONFIGURATOR_ANALYTICS_EVENT.`as`("e")
        val pm = PRODUCT_MODEL.`as`("pm")
        val metrics = sessionMetricFields(e)
        val submissions = submissionCountField(ownerId, productModelId, fromAt, toAt)
        val eventRow =
            dslContext
                .select(
                    metrics.configuratorOpens,
                    metrics.changedAtLeastOnce,
                    metrics.requestFormOpens,
                )
                .from(e)
                .join(pm)
                .on(pm.ID.eq(e.PRODUCT_MODEL_ID))
                .where(
                    pm.USER_ID
                        .eq(ownerId)
                        .and(e.PRODUCT_MODEL_ID.eq(productModelId))
                        .and(e.OCCURRED_AT.between(fromAt, toAt)),
                )
                .fetchSingle()

        return ConfiguratorAnalyticsHeadline(
            configuratorOpens = eventRow.getValue(metrics.configuratorOpens).asCountLong(),
            changedAtLeastOnce = eventRow.getValue(metrics.changedAtLeastOnce).asCountLong(),
            requestFormOpens = eventRow.getValue(metrics.requestFormOpens).asCountLong(),
            submissions =
                dslContext
                    .select(submissions)
                    .fetchSingle(submissions)
                    .asCountLong(),
        )
    }

    /**
     * For this seller (`ownerId`): headline-style metrics per owned product model in `fromAt`..`toAt` (table “all models”).
     */
    override fun loadAnalyticsPerProductModelForUser(
        ownerId: UUID,
        fromAt: OffsetDateTime,
        toAt: OffsetDateTime,
    ): List<ConfiguratorAnalyticsPerModelRow> {
        val pmMain = PRODUCT_MODEL.`as`("pm_list")
        val eventMetrics = eventMetricsTable(ownerId, fromAt, toAt)
        val submissionCounts = submissionCountsTable(ownerId, fromAt, toAt)

        return dslContext
            .select(
                pmMain.ID,
                pmMain.NAME,
                eventMetrics.configuratorOpens,
                eventMetrics.changedAtLeastOnce,
                eventMetrics.requestFormOpens,
                submissionCounts.submissions,
            )
            .from(pmMain)
            .leftJoin(eventMetrics.table)
            .on(pmMain.ID.eq(eventMetrics.productModelId))
            .leftJoin(submissionCounts.table)
            .on(pmMain.ID.eq(submissionCounts.productModelId))
            .where(pmMain.USER_ID.eq(ownerId))
            .orderBy(pmMain.NAME.asc())
            .fetch()
            .map { r ->
                ConfiguratorAnalyticsPerModelRow(
                    productModelId = r.get(pmMain.ID)!!,
                    productModelName = r.get(pmMain.NAME)!!,
                    configuratorOpens = r.get(eventMetrics.configuratorOpens).asCountLong(),
                    changedAtLeastOnce = r.get(eventMetrics.changedAtLeastOnce).asCountLong(),
                    requestFormOpens = r.get(eventMetrics.requestFormOpens).asCountLong(),
                    submissions = r.get(submissionCounts.submissions).asCountLong(),
                )
            }
    }

    private fun eventMetricsTable(
        ownerId: UUID,
        fromAt: OffsetDateTime,
        toAt: OffsetDateTime,
    ): EventMetricsTable {
        val e = CONFIGURATOR_ANALYTICS_EVENT.`as`("e")
        val pm = PRODUCT_MODEL.`as`("pm")
        val metrics = sessionMetricFields(e)
        val productModelId = e.PRODUCT_MODEL_ID.`as`("pm_id")

        val table =
            dslContext
                .select(
                    productModelId,
                    metrics.configuratorOpens,
                    metrics.changedAtLeastOnce,
                    metrics.requestFormOpens,
                )
                .from(e)
                .join(pm)
                .on(pm.ID.eq(e.PRODUCT_MODEL_ID))
                .where(
                    pm.USER_ID
                        .eq(ownerId)
                        .and(e.OCCURRED_AT.between(fromAt, toAt)),
                )
                .groupBy(e.PRODUCT_MODEL_ID)
                .asTable("ev")

        return EventMetricsTable(
            table = table,
            productModelId = table.field(productModelId)!!,
            configuratorOpens = table.field(metrics.configuratorOpens)!!,
            changedAtLeastOnce = table.field(metrics.changedAtLeastOnce)!!,
            requestFormOpens = table.field(metrics.requestFormOpens)!!,
        )
    }

    private fun submissionCountsTable(
        ownerId: UUID,
        fromAt: OffsetDateTime,
        toAt: OffsetDateTime,
    ): SubmissionCountsTable {
        val cr = CUSTOMER_REQUEST.`as`("cr")
        val pm = PRODUCT_MODEL.`as`("pm_sub")
        val productModelId = cr.PRODUCT_MODEL_ID.`as`("pm_id")
        val submissions = DSL.count(cr.ID).`as`("submissions")

        val table =
            dslContext
                .select(productModelId, submissions)
                .from(cr)
                .join(pm)
                .on(pm.ID.eq(cr.PRODUCT_MODEL_ID))
                .where(
                    pm.USER_ID
                        .eq(ownerId)
                        .and(cr.CREATED_AT.between(fromAt, toAt)),
                )
                .groupBy(cr.PRODUCT_MODEL_ID)
                .asTable("sb")

        return SubmissionCountsTable(
            table = table,
            productModelId = table.field(productModelId)!!,
            submissions = table.field(submissions)!!,
        )
    }

    private fun submissionCountField(
        ownerId: UUID,
        productModelId: UUID,
        fromAt: OffsetDateTime,
        toAt: OffsetDateTime,
    ): Field<Int> {
        val cr = CUSTOMER_REQUEST.`as`("cr")
        val pm = PRODUCT_MODEL.`as`("pm_cr")

        return DSL
            .select(DSL.count(cr.ID))
            .from(cr)
            .join(pm)
            .on(pm.ID.eq(cr.PRODUCT_MODEL_ID))
            .where(
                pm.USER_ID
                    .eq(ownerId)
                    .and(cr.PRODUCT_MODEL_ID.eq(productModelId))
                    .and(cr.CREATED_AT.between(fromAt, toAt)),
            )
            .asField("submissions")
    }
}

private data class SessionMetricFields(
    val configuratorOpens: Field<Int>,
    val changedAtLeastOnce: Field<Int>,
    val requestFormOpens: Field<Int>,
)

private data class EventMetricsTable(
    val table: Table<*>,
    val productModelId: Field<UUID?>,
    val configuratorOpens: Field<Int>,
    val changedAtLeastOnce: Field<Int>,
    val requestFormOpens: Field<Int>,
)

private data class SubmissionCountsTable(
    val table: Table<*>,
    val productModelId: Field<UUID?>,
    val submissions: Field<Int>,
)

private fun sessionMetricFields(e: ConfiguratorAnalyticsEvent) =
    SessionMetricFields(
        configuratorOpens = distinctSessions(e, ConfiguratorAnalyticsEventType.CONFIGURATOR_OPEN).`as`("opens"),
        changedAtLeastOnce = distinctSessions(e, ConfiguratorAnalyticsEventType.CONFIGURATION_CHANGE).`as`("changed"),
        requestFormOpens = distinctSessions(e, ConfiguratorAnalyticsEventType.REQUEST_FORM_OPEN).`as`("form_opens"),
    )

private fun distinctSessions(
    e: ConfiguratorAnalyticsEvent,
    eventTypeCode: String,
) = DSL.countDistinct(
    DSL.case_().`when`(e.EVENT_TYPE.eq(eventTypeCode), e.SESSION_ID),
)

private fun Any?.asCountLong(): Long = (this as Number?)?.toLong() ?: 0L

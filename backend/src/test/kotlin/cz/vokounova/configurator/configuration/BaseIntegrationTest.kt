package cz.vokounova.configurator.configuration

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import org.jooq.DSLContext
import org.jooq.impl.DSL
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.TestInstance
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.junit.jupiter.SpringExtension
import org.springframework.test.web.servlet.MvcResult
import org.testcontainers.junit.jupiter.Testcontainers
import java.util.Locale
import java.util.TimeZone

@Testcontainers
@ActiveProfiles("test")
@ExtendWith(SpringExtension::class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@SpringBootTest(
    classes = [TestContainerConfiguration::class],
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
)
@Import(TestConfiguration::class)
@AutoConfigureMockMvc
abstract class BaseIntegrationTest {
    @Autowired
    lateinit var dslContext: DSLContext

    @Autowired
    lateinit var objectMapper: ObjectMapper

    @BeforeAll
    fun init() {
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"))
        Locale.setDefault(Locale.US) // ensure '.' separator

        cleanDatabase()
    }

    protected final inline fun <reified T> readResponseAsList(result: MvcResult): List<T> =
        objectMapper.readValue(
            result.response.contentAsString,
            object : TypeReference<List<T>>() {},
        )

    protected final inline fun <reified T> readResponse(result: MvcResult): T =
        objectMapper.readValue(
            result.response.contentAsString,
            object : TypeReference<T>() {},
        )

    protected fun cleanDatabase() {
        dslContext.transaction { config ->
            val ctx = DSL.using(config)

            // Disable foreign key checks for PostgreSQL
            ctx.execute("SET CONSTRAINTS ALL DEFERRED")

            // Get all tables from the public schema
            val tables =
                ctx
                    .meta()
                    .tables
                    .filter { it.schema?.name == "public" }
                    .filterNot { it.name in setOf("flyway_schema_history") } // Exclude flyway table

            val tableNames = tables.joinToString(", ") { "${it.schema?.name}.${it.name}" }

            // Truncate all tables
            ctx.execute(" TRUNCATE TABLE $tableNames CASCADE")

            // Re-enable foreign key checks
            ctx.execute("SET CONSTRAINTS ALL IMMEDIATE")
        }
    }

    @BeforeEach
    fun setup() {
    }

    @AfterEach
    fun cleanUp() {
    }
}

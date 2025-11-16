package cz.vokounova.configurator.configuration

import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.jdbc.datasource.DriverManagerDataSource
import org.testcontainers.containers.PostgreSQLContainer
import javax.sql.DataSource

@TestConfiguration
class TestContainerConfiguration {
    @Bean
    fun postgresContainer(): PostgreSQLContainer<*> = PostgresContainerSingleton.getInstance()

    @Bean
    fun dataSource(container: PostgreSQLContainer<*>): DataSource =
        DriverManagerDataSource().apply {
            setDriverClassName(container.driverClassName)
            url = container.jdbcUrl
            username = container.username
            password = container.password
        }
}

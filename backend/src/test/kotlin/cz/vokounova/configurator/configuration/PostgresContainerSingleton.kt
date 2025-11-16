package cz.vokounova.configurator.configuration

import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.utility.DockerImageName

object PostgresContainerSingleton {
    private const val POSTGRES_IMAGE = "postgres"
    private const val POSTGRES_VERSION = "15.3"
    private var instance: PostgreSQLContainer<*>? = null

    fun getInstance(): PostgreSQLContainer<*> =
        instance ?: synchronized(this) {
            instance ?: createContainer().also { instance = it }
        }

    private fun createContainer(): PostgreSQLContainer<*> {
        val imageName = "$POSTGRES_IMAGE:$POSTGRES_VERSION"

        return PostgreSQLContainer(
            DockerImageName
                .parse(imageName)
                .asCompatibleSubstituteFor(POSTGRES_IMAGE),
        ).apply {
            withDatabaseName("configuratordb-test")
            withUsername("test")
            withPassword("test")
            start()
        }
    }
}

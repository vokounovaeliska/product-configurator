package cz.vokounova.configurator

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling
import java.util.*

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
class ConfiguratorBackendApplication

fun main(args: Array<String>) {
    setDefaultTimeZone()
    runApplication<ConfiguratorBackendApplication>(*args)
}

private fun setDefaultTimeZone() {
    TimeZone.setDefault(TimeZone.getTimeZone("UTC"))
    println("Default timezone set to: ${TimeZone.getDefault().id}")
}

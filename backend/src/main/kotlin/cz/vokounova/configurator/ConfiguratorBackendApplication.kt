package cz.vokounova.configurator

import cz.vokounova.configurator.shared.email.EmailConfiguration
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication
import org.springframework.context.annotation.Import
import org.springframework.scheduling.annotation.EnableAsync
import org.springframework.scheduling.annotation.EnableScheduling
import java.util.*

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableAsync
@EnableScheduling
@Import(EmailConfiguration::class)
class ConfiguratorBackendApplication

fun main(args: Array<String>) {
    setDefaultTimeZone()
    runApplication<ConfiguratorBackendApplication>(*args)
}

private fun setDefaultTimeZone() {
    TimeZone.setDefault(TimeZone.getTimeZone("UTC"))
    println("Default timezone set to: ${TimeZone.getDefault().id}")
}

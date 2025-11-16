package cz.vokounova.configurator.shared.config

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.databind.module.SimpleModule
import com.fasterxml.jackson.dataformat.xml.JacksonXmlModule
import com.fasterxml.jackson.dataformat.xml.XmlMapper
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class ModuleConfig(
    private val simpleModules: List<SimpleModule>,
) {
    @Bean
    fun xmlMapper(): XmlMapper =
        XmlMapper(
            JacksonXmlModule(),
        ).apply {
            registerKotlinModule()
        }

    @Bean
    fun objectMapper(): ObjectMapper {
        val mapper =
            jacksonObjectMapper()
                .registerModule(JavaTimeModule())

        // https://github.com/FasterXML/jackson-databind/wiki/Serialization-Features#datatype-specific-serialization
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)

        mapper.registerModules(simpleModules)

        return mapper
    }
}

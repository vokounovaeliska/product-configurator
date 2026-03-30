package cz.vokounova.configurator.shared.openapi

import io.swagger.v3.oas.models.Components
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.PathItem
import io.swagger.v3.oas.models.security.SecurityRequirement
import io.swagger.v3.oas.models.security.SecurityScheme
import io.swagger.v3.oas.models.servers.Server
import org.springdoc.core.customizers.OpenApiCustomizer
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class OpenApiConfiguration(
    @Value("\${app.swagger.server-url:}") private val serverUrl: String,
) {
    /**
     * When [app.swagger.server-url] is set (e.g. https://api.konfiguruj.com in prod), Swagger UI uses it
     * for "Try it out" instead of inferring http:// from behind a reverse proxy.
     */
    @Bean
    fun openApiServerCustomizer(): OpenApiCustomizer {
        return OpenApiCustomizer { openApi: OpenAPI ->
            val url = serverUrl.trim().trimEnd('/')
            if (url.isNotEmpty()) {
                openApi.servers = listOf(Server().url(url).description("API server"))
            }
        }
    }

    /**
     * Registers HTTP Bearer (JWT) so Swagger UI shows **Authorize** and sends `Authorization: Bearer …`
     * on "Try it out" for endpoints that require authentication.
     *
     * Flow: call **POST /users/api/v1/auth/public/login**, copy `token` from the response, then **Authorize** and paste it.
     */
    @Bean
    fun openApiBearerSecurityCustomizer(): OpenApiCustomizer {
        return OpenApiCustomizer { openApi: OpenAPI ->
            val components = openApi.components ?: Components()
            openApi.components = components
            components.addSecuritySchemes(
                "bearer-jwt",
                SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description(
                        "Access token from POST /users/api/v1/auth/public/login (JSON field `token`). " +
                            "Click Authorize and paste the token (no \"Bearer \" prefix).",
                    ),
            )
            openApi.paths?.forEach { (path, pathItem) ->
                pathItem.readOperationsMap()?.forEach { (method, operation) ->
                    if (!isPublicApiPath(path, method)) {
                        operation.addSecurityItem(SecurityRequirement().addList("bearer-jwt"))
                    }
                }
            }
        }
    }

    private fun isPublicApiPath(
        path: String,
        method: PathItem.HttpMethod,
    ): Boolean =
        when {
            path.startsWith("/api/v1/files/") && method == PathItem.HttpMethod.GET -> true
            path.startsWith("/embed/api/v1/products/") && method == PathItem.HttpMethod.GET -> true
            path == "/embed/api/v1/customer-requests" && method == PathItem.HttpMethod.POST -> true
            path == "/users/api/v1/auth/public/login" && method == PathItem.HttpMethod.POST -> true
            path == "/users/api/v1/auth/public/register" && method == PathItem.HttpMethod.POST -> true
            path == "/users/api/v1/auth/refresh" && method == PathItem.HttpMethod.GET -> true
            else -> false
        }
}

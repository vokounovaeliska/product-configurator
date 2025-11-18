# syntax=docker/dockerfile:1
FROM docker.io/eclipse-temurin:21-jdk-jammy AS source

ARG CI_GITLAB_PAT

WORKDIR /build

# Copy the mvnw wrapper with executable permissions.
COPY --chmod=0755 mvnw mvnw
COPY pom.xml pom.xml

# Copy Maven wrapper and settings (if .mvn directory exists)
# Use RUN to conditionally copy if directory exists
RUN --mount=type=bind,source=.,target=/context \
    if [ -d /context/.mvn ]; then \
        cp -r /context/.mvn .mvn; \
    fi

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.m2 so that subsequent builds don't have to
# re-download packages.
# Use Maven settings if available, otherwise use default
RUN --mount=type=bind,source=pom.xml,target=pom.xml \
    --mount=type=cache,target=/root/.m2 \
    if [ -f .mvn/local-settings.xml ]; then \
        sed -i "s/\${env.CI_GITLAB_PAT}/$CI_GITLAB_PAT/g" .mvn/local-settings.xml && \
        ./mvnw dependency:go-offline -DskipTests -s .mvn/local-settings.xml; \
    else \
        ./mvnw dependency:go-offline -DskipTests; \
    fi

################################################################################

# Create a stage for building the application based on the stage with downloaded dependencies.
# This Dockerfile is optimized for Java applications that output an uber jar, which includes
# all the dependencies needed to run your app inside a JVM.
FROM source AS package

WORKDIR /build

COPY ./src src/
# Copy jOOQ generated sources if they exist (optional)
# Use RUN to conditionally copy if directory exists
RUN --mount=type=bind,source=.,target=/context \
    mkdir -p target/generated-sources/jooq && \
    if [ -d /context/target/generated-sources/jooq ] && [ "$(ls -A /context/target/generated-sources/jooq 2>/dev/null)" ]; then \
        cp -r /context/target/generated-sources/jooq/* target/generated-sources/jooq/; \
    fi
RUN --mount=type=bind,source=pom.xml,target=pom.xml \
    --mount=type=cache,target=/root/.m2 \
    if [ -f .mvn/local-settings.xml ]; then \
        ./mvnw package -DskipTests -Dskip.jooq.generation -Dskip.flyway.migration -s .mvn/local-settings.xml && \
        mv target/$(./mvnw help:evaluate -Dexpression=project.artifactId -q -DforceStdout)-$(./mvnw help:evaluate -Dexpression=project.version -q -DforceStdout).jar target/app.jar; \
    else \
        ./mvnw package -DskipTests -Dskip.jooq.generation -Dskip.flyway.migration && \
        mv target/$(./mvnw help:evaluate -Dexpression=project.artifactId -q -DforceStdout)-$(./mvnw help:evaluate -Dexpression=project.version -q -DforceStdout).jar target/app.jar; \
    fi

################################################################################

# Create a stage for extracting the application into separate layers.
# Take advantage of Spring Boot's layer tools and Docker's caching by extracting
# the packaged application into separate layers that can be copied into the final stage.
# See Spring's docs for reference:
# https://docs.spring.io/spring-boot/docs/current/reference/html/container-images.html
FROM package AS extract

WORKDIR /build

RUN java -Djarmode=layertools -jar target/app.jar extract --destination target/extracted

################################################################################

# Create a new stage for running the application that contains the minimal
# runtime dependencies for the application. This often uses a different base
# image from the install or build stage where the necessary files are copied
# from the install stage.
#
# The example below uses eclipse-turmin's JRE image as the foundation for running the app.
# By specifying the "21-jre-jammy" tag, it will also use whatever happens to be the
# most recent version of that tag when the Dockerfile is built.
# If reproducability becomes important, consider using a specific digest SHA, like
# eclipse-temurin@sha256:99cede493dfd88720b610eb8077c8688d3cca50003d76d1d539b0efc8cca72b4.
FROM eclipse-temurin:21-jre-jammy AS final

# Create a non-privileged user that the app will run under.
# See https://docs.docker.com/go/dockerfile-user-best-practices/
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser
USER appuser

# Copy the executable from the "package" stage.
COPY --from=extract build/target/extracted/dependencies/ ./
COPY --from=extract build/target/extracted/spring-boot-loader/ ./
COPY --from=extract build/target/extracted/snapshot-dependencies/ ./
COPY --from=extract build/target/extracted/application/ ./

EXPOSE 8080

ENTRYPOINT [ "java", "org.springframework.boot.loader.launch.JarLauncher" ]


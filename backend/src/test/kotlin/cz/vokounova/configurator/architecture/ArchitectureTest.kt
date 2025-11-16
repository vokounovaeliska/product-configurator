package cz.vokounova.configurator.architecture

import com.tngtech.archunit.core.domain.JavaClasses
import com.tngtech.archunit.core.importer.ImportOption.DoNotIncludeTests
import com.tngtech.archunit.junit.AnalyzeClasses
import com.tngtech.archunit.junit.ArchTest
import com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses

@Suppress("ktlint:standard:function-naming")
@AnalyzeClasses(packages = ["cz.vokounova.configurator"], importOptions = [DoNotIncludeTests::class])
class ArchitectureTest {
    @ArchTest
    fun `domain should not depend on application or infrastructure`(importedClasses: JavaClasses) {
        val rule =
            noClasses()
                .that()
                .resideInAPackage("..domain..")
                .should()
                .dependOnClassesThat()
                .resideInAnyPackage("..application..", "..infrastructure..")
                .because("Domain should be independent of application and infrastructure concerns")

        rule.check(importedClasses)
    }

    @ArchTest
    fun `application should not depend on infrastructure`(importedClasses: JavaClasses) {
        val rule =
            noClasses()
                .that()
                .resideInAPackage("..application..")
                .should()
                .dependOnClassesThat()
                .resideInAPackage("..infrastructure..")
                .because("Application should not depend on infrastructure implementations")

        rule.check(importedClasses)
    }

    @ArchTest
    fun `ports should only be accessed through their defined interfaces`(importedClasses: JavaClasses) {
        val inboundPortRule =
            noClasses()
                .that()
                .resideOutsideOfPackage("..ports.inbound..")
                .should()
                .dependOnClassesThat()
                .resideInAPackage("..ports.inbound..")
                .andShould()
                .onlyDependOnClassesThat()
                .areInterfaces()
                .because("Inbound ports should only be accessed through their interfaces")

        val outboundPortRule =
            noClasses()
                .that()
                .resideOutsideOfPackage("..ports.outbound..")
                .should()
                .dependOnClassesThat()
                .resideInAPackage("..ports.outbound..")
                .andShould()
                .onlyDependOnClassesThat()
                .areInterfaces()
                .because("Outbound ports should only be accessed through their interfaces")

        inboundPortRule.check(importedClasses)
        outboundPortRule.check(importedClasses)
    }

    @ArchTest
    fun `api should only expose intended classes`(importedClasses: JavaClasses) {
        val rule =
            noClasses()
                .that()
                .resideInAPackage("..api..")
                .should()
                .beAnnotatedWith("org.springframework.stereotype.Service")
                .orShould()
                .beAnnotatedWith("org.springframework.stereotype.Repository")
                .orShould()
                .beAnnotatedWith("org.springframework.stereotype.Component")
                .because("API should not expose internal implementation details")

        rule.check(importedClasses)
    }
}

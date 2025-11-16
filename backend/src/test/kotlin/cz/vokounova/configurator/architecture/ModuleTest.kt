package cz.vokounova.configurator.architecture

import com.tngtech.archunit.core.domain.JavaClasses
import com.tngtech.archunit.core.importer.ImportOption.DoNotIncludeTests
import com.tngtech.archunit.junit.AnalyzeClasses
import com.tngtech.archunit.junit.ArchTest
import com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes
import com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses

@Suppress("ktlint:standard:function-naming")
@AnalyzeClasses(packages = ["cz.vokounova.configurator"], importOptions = [DoNotIncludeTests::class])
class ModuleTest {
    companion object {
        enum class Modules(
            val packageName: String,
        ) {
            SHARED("shared"),
            USERS("users"),
        }
    }

    @ArchTest
    fun `ensure independence of Shared module`(importedClasses: JavaClasses) {
        val modulePackages =
            Modules.entries
                .filter { it.packageName != Modules.SHARED.packageName }
                .map { "cz.vokounova.configurator.${it.packageName}.." }
                .toTypedArray()

        val rule =
            noClasses()
                .that()
                .resideInAnyPackage("cz.vokounova.configurator.${Modules.SHARED.packageName}..")
                .should()
                .dependOnClassesThat()
                .resideInAnyPackage(*modulePackages)
                .because("Classes in the Common module must not have any application module dependencies")

        rule.check(importedClasses)
    }

    @ArchTest
    fun `ensure modularity of Application modules`(importedClasses: JavaClasses) {
        val modulePackages =
            Modules.entries
                .filter { it.packageName != Modules.SHARED.packageName }
                .map { it.packageName }
                .toTypedArray()

        modulePackages.forEach { packageName ->
            val rule =
                classes()
                    .that()
                    .resideInAnyPackage(
                        "cz.vokounova.configurator.$packageName.application..",
                        "cz.vokounova.configurator.$packageName.domain..",
                        "cz.vokounova.configurator.$packageName.infrastructure..",
                        "cz.vokounova.configurator.$packageName.ports..",
                    ).should()
                    .onlyBeAccessed()
                    .byAnyPackage("cz.vokounova.configurator.$packageName..")
                    .because("Classes in internal package of application module must not be used by other application modules")
            rule.check(importedClasses)
        }
    }
}

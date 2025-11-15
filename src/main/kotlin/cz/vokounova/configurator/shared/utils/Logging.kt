package cz.vokounova.configurator.shared.utils

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import kotlin.reflect.KClass
import kotlin.reflect.full.companionObject

/*
Based on https://stackoverflow.com/questions/34416869/idiomatic-way-of-logging-in-kotlin/65195488#65195488
 */

// Return logger for Java class, if companion object fix the name
fun <T : Any> logger(forClass: Class<T>): Logger = LoggerFactory.getLogger(unwrapCompanionClass(forClass).name)

// Return logger for Kotlin class
fun <T : Any> logger(forClass: KClass<T>): Logger = logger(forClass.java)

// unwrap companion class to enclosing class given a Java Class
fun <T : Any> unwrapCompanionClass(ofClass: Class<T>): Class<*> =
    ofClass.enclosingClass?.takeIf {
        ofClass.enclosingClass.kotlin.companionObject
            ?.java == ofClass
    } ?: ofClass

// unwrap companion class to enclosing class given a Kotlin Class
fun <T : Any> unwrapCompanionClass(ofClass: KClass<T>): KClass<*> = unwrapCompanionClass(ofClass.java).kotlin

// return a lazy logger property delegate for enclosing class
fun <R : Any> R.logger(): Lazy<Logger> = lazy { logger(this.javaClass) }

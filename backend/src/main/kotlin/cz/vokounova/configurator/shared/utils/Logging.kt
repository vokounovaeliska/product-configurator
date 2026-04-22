package cz.vokounova.configurator.shared.utils

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import kotlin.reflect.KClass
import kotlin.reflect.full.companionObject

fun <T : Any> logger(forClass: Class<T>): Logger = LoggerFactory.getLogger(unwrapCompanionClass(forClass).name)

fun <T : Any> logger(forClass: KClass<T>): Logger = logger(forClass.java)

fun <T : Any> unwrapCompanionClass(ofClass: Class<T>): Class<*> =
    ofClass.enclosingClass?.takeIf {
        ofClass.enclosingClass.kotlin.companionObject
            ?.java == ofClass
    } ?: ofClass

fun <R : Any> R.logger(): Lazy<Logger> = lazy { logger(this.javaClass) }

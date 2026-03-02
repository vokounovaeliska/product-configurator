package cz.vokounova.configurator.customerrequest.application

import cz.vokounova.configurator.customerrequest.domain.CustomerRequest
import cz.vokounova.configurator.shared.email.ports.outbound.EmailService
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service

/**
 * Sends confirmation email to the customer after a quote request is created.
 * Uses @Async so the HTTP response is not delayed by email delivery.
 */
@Service
class CustomerRequestEmailNotificationService(
    private val emailService: EmailService,
) {
    @Async
    fun sendConfirmationEmail(request: CustomerRequest) {
        emailService.send(
            to = request.customerEmail,
            subject = CustomerRequestConfirmationEmail.subject(request),
            bodyHtml = CustomerRequestConfirmationEmail.bodyHtml(request),
            bodyText = CustomerRequestConfirmationEmail.bodyText(request),
        )
    }
}

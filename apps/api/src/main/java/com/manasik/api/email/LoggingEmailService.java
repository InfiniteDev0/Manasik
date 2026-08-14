package com.manasik.api.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Development email transport: writes the message to the log instead of sending
 * it.
 *
 * <p>Active whenever {@code manasik.email.provider} is not {@code resend},
 * which is the default. That means the whole auth flow — register, verify,
 * reset — can be exercised end to end with no Resend account, no verified
 * domain, and no risk of a test registration emailing a real person.
 *
 * <p>It prints the verification code in plain text. That is the point, and it
 * is also why this implementation must never be active in production: the
 * {@code resend} provider is selected explicitly by configuration.
 */
@Service
@ConditionalOnProperty(name = "manasik.email.provider", havingValue = "log", matchIfMissing = true)
public class LoggingEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(LoggingEmailService.class);

    @Override
    public void sendVerificationCode(String to, String fullName, String code) {
        log.info("""

                ┌─ EMAIL (dev, not sent) ──────────────────────────────
                │ To      : {}
                │ Subject : Verify your Manasik account
                │
                │ VERIFICATION CODE: {}
                │
                │ Expires in 15 minutes.
                └──────────────────────────────────────────────────────""", to, code);
    }

    @Override
    public void sendPasswordResetCode(String to, String fullName, String code) {
        log.info("""

                ┌─ EMAIL (dev, not sent) ──────────────────────────────
                │ To      : {}
                │ Subject : Reset your Manasik password
                │
                │ RESET CODE: {}
                │
                │ Expires in 15 minutes.
                └──────────────────────────────────────────────────────""", to, code);
    }

    @Override
    public void sendWelcome(String to, String fullName) {
        log.info("EMAIL (dev, not sent) -> welcome message for {} <{}>", fullName, to);
    }
}

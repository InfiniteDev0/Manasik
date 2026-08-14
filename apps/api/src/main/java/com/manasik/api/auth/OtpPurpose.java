package com.manasik.api.auth;

/**
 * What an OTP is for. Mirrors {@code ck_otp_purpose}.
 *
 * <p>Purpose is part of the lookup, not just a label: a code issued to verify
 * an email must never be accepted to reset a password. Without this split, an
 * attacker who obtains a verification code could use it to take over the
 * account.
 */
public enum OtpPurpose {
    VERIFY_EMAIL,
    RESET_PASSWORD
}

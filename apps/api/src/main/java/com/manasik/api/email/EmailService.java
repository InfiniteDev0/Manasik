package com.manasik.api.email;

/**
 * Outbound transactional email.
 *
 * <p>Every method is deliberately allowed to fail quietly. Registration must
 * not roll back because a mail provider had a bad minute — the account exists,
 * and the user can request a new code. Losing the signup instead would be a
 * far worse outcome than a resend.
 */
public interface EmailService {

    /**
     * @param code the plaintext OTP — the only place it exists outside the
     *             user's inbox, since only its hash is stored
     */
    void sendVerificationCode(String to, String fullName, String code);

    void sendPasswordResetCode(String to, String fullName, String code);

    void sendWelcome(String to, String fullName);
}

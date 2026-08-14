package com.manasik.api.organization;

/**
 * Rough annual pilgrim volume, collected during onboarding.
 *
 * <p>Banded rather than exact — it is a sizing signal for plan selection, not
 * an accounting figure, and agencies will not know a precise number anyway.
 * Mirrors {@code ck_organizations_volume}.
 */
public enum PilgrimVolume {
    UNDER_100,
    FROM_100_TO_500,
    FROM_500_TO_2000,
    OVER_2000
}

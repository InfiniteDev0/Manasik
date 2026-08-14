package com.manasik.api.common.ratelimit;

import com.manasik.api.auth.RefreshSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Periodic housekeeping.
 *
 * <p>Both jobs clear things that would otherwise accumulate without limit:
 * rate-limit windows keyed by IP (an attacker chooses how many exist), and
 * expired refresh sessions.
 */
@Component
public class RateLimiterCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(RateLimiterCleanupJob.class);

    private final RateLimiter rateLimiter;
    private final RefreshSessionRepository refreshSessionRepository;

    public RateLimiterCleanupJob(RateLimiter rateLimiter,
                                 RefreshSessionRepository refreshSessionRepository) {
        this.rateLimiter = rateLimiter;
        this.refreshSessionRepository = refreshSessionRepository;
    }

    /** Every 10 minutes; windows are 15 minutes or shorter. */
    @Scheduled(fixedDelay = 10 * 60 * 1000, initialDelay = 60 * 1000)
    public void evictRateLimitWindows() {
        rateLimiter.evictExpired();
    }

    /**
     * Hourly. Expired sessions are already rejected on use, so this is purely
     * to stop the table growing forever.
     */
    @Scheduled(fixedDelay = 60 * 60 * 1000, initialDelay = 5 * 60 * 1000)
    @Transactional
    public void deleteExpiredSessions() {
        int deleted = refreshSessionRepository.deleteExpired(Instant.now());
        if (deleted > 0) {
            log.info("Purged {} expired refresh sessions", deleted);
        }
    }
}

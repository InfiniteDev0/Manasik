package com.manasik.api.common.ratelimit;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Fixed-window counter, held in memory.
 *
 * <h2>Why in-memory, and what that costs</h2>
 *
 * Redis was dropped from the stack (D6), so counters live in this process.
 * That is correct for a single instance and wrong the moment there are two:
 * each would keep its own count, and a limit of 10 effectively becomes 10×N.
 *
 * <p>That trade is acceptable now — this exists to stop credential stuffing and
 * OTP brute force from a laptop, not a distributed botnet — but it must be
 * revisited before scaling out. It is also lost on restart, which briefly
 * resets every counter.
 *
 * <p>A fixed window (rather than sliding) allows a burst across a boundary: up
 * to 2× the limit if the requests straddle it. Simpler, and for these limits
 * the difference does not matter.
 */
@Component
public class RateLimiter {

    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    /**
     * @return true if the request is permitted, false if the limit is exceeded
     */
    public boolean tryAcquire(String key, int limit, Duration window) {
        Instant now = Instant.now();

        Window current = windows.compute(key, (k, existing) -> {
            if (existing == null || existing.isExpired(now)) {
                return new Window(now.plus(window));
            }
            return existing;
        });

        return current.count.incrementAndGet() <= limit;
    }

    /** Seconds until the current window resets, for the {@code Retry-After} header. */
    public long secondsUntilReset(String key) {
        Window window = windows.get(key);
        if (window == null) {
            return 0;
        }
        long seconds = Duration.between(Instant.now(), window.resetAt).getSeconds();
        return Math.max(seconds, 0);
    }

    /**
     * Drops expired entries.
     *
     * <p>Without this the map grows once per distinct IP forever — a slow leak
     * that is also a trivial memory-exhaustion vector, since an attacker
     * controls how many distinct keys they create.
     */
    public void evictExpired() {
        Instant now = Instant.now();
        windows.entrySet().removeIf(entry -> entry.getValue().isExpired(now));
    }

    int trackedKeys() {
        return windows.size();
    }

    private static final class Window {
        private final Instant resetAt;
        private final AtomicInteger count = new AtomicInteger(0);

        private Window(Instant resetAt) {
            this.resetAt = resetAt;
        }

        private boolean isExpired(Instant now) {
            return now.isAfter(resetAt);
        }
    }
}

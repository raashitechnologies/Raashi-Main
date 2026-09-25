-- D1-backed application rate limiting used by app.core.rate_limiter.
CREATE TABLE IF NOT EXISTS rate_limit_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    window_start INTEGER NOT NULL,
    rate_key TEXT NOT NULL,
    route TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup ON rate_limit_events (window_start, rate_key, route);

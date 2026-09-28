DELETE FROM login_attempts;

INSERT OR REPLACE INTO users (
    id, email, password_hash, name, role, is_active, email_verified, created_at, updated_at
) VALUES 
('6a7833e117f8d046b2c4cf2b', 'admin@raashi.com', '$2b$12$IclTKKu/x/pEMCBoFJVOxuNBBW25aRo63xILBcHQkGOYifhuNCwOa', 'Admin', 'admin', 1, 1, '2026-09-24T00:00:00.000Z', '2026-09-24T00:00:00.000Z'),
('6a7833e117f8d046b2c4cf2c', 'coordinator@raashi.com', '$2b$12$msflSkXPJCX49XawxjIBW.AT.3jxEA9TyDJwZISZliCwtqeVw7JJG', 'Coordinator', 'coordinator', 1, 1, '2026-09-24T00:00:00.000Z', '2026-09-24T00:00:00.000Z');

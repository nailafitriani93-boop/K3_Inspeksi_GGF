BEGIN;

INSERT INTO users (id_user, username, password, nama_lengkap, email, role, akses_dashboard, aktif, created_at, updated_at) VALUES
(125, '100001', '$2b$10$vR5kZxlRxYpgO3cg9x3mvu/WGnJSMqaXykQP1rdYXNYwC1w064Bsm', 'Naila H.F', NULL, 'ADMIN_DEVELOPER', true, true, '2026-09-13T10:18:59.861Z', '2026-09-13T10:21:58.712Z'),
(126, '100002', '$2b$10$uKKOHLIsrixDWetcn5rSpe0cqOAcj6LeB8ejdkiQ/dHfTAxcVeSZe', 'Abdul Haris Siregar', NULL, 'ADMIN', true, true, '2026-09-13T10:19:00.000Z', '2026-09-13T10:21:58.834Z'),
(127, '100003', '$2b$10$3hh1gi.KAEdMi97MCJ95DevJyXrFXaPCjkMgkD.1bt87KDTtG4cWe', 'Nirwati', NULL, 'ADMIN_INSPECTOR', true, true, '2026-09-13T10:19:00.109Z', '2026-09-13T10:21:58.940Z'),
(128, '100004', '$2b$10$eeQVjpT8z/1ffJlNecEUN.H2blI6et4Nec3dlGQuwpsJou8oWXrTe', 'Handoko Waskito', NULL, 'ADMIN_INSPECTOR', true, true, '2026-09-13T10:19:00.211Z', '2026-09-13T10:21:59.124Z');

SELECT setval('users_id_user_seq', (SELECT MAX(id_user) FROM users));

COMMIT;

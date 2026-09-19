--
-- PostgreSQL database dump
--

\restrict GjYuCMtgoaLmWtMAeBh7bhEkTfsh0ht2jHgouU15IPPBcrBlzX1ZJblIoJ7iLdm

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users (id_user, username, password, nama_lengkap, role, aktif, created_at, updated_at, email, akses_dashboard, kelola_user, akses_data_temuan, akses_form_inspeksi) VALUES (125, '100001', '$2b$10$vR5kZxlRxYpgO3cg9x3mvu/WGnJSMqaXykQP1rdYXNYwC1w064Bsm', 'Naila H.F', 'ADMIN_DEVELOPER', true, '2026-09-13 10:18:59.861', '2026-09-13 10:21:58.712', NULL, true, true, true, true);
INSERT INTO public.users (id_user, username, password, nama_lengkap, role, aktif, created_at, updated_at, email, akses_dashboard, kelola_user, akses_data_temuan, akses_form_inspeksi) VALUES (127, '100003', '$2b$10$3hh1gi.KAEdMi97MCJ95DevJyXrFXaPCjkMgkD.1bt87KDTtG4cWe', 'Nirwati', 'ADMIN_SISTEM_MUTU', true, '2026-09-13 10:19:00.109', '2026-09-13 10:21:58.94', NULL, true, true, true, true);
INSERT INTO public.users (id_user, username, password, nama_lengkap, role, aktif, created_at, updated_at, email, akses_dashboard, kelola_user, akses_data_temuan, akses_form_inspeksi) VALUES (126, '100002', '$2b$10$uKKOHLIsrixDWetcn5rSpe0cqOAcj6LeB8ejdkiQ/dHfTAxcVeSZe', 'Abdul Haris Siregar', 'ADMIN_SISTEM_MUTU', true, '2026-09-13 10:19:00', '2026-09-13 10:21:58.834', NULL, true, true, true, true);
INSERT INTO public.users (id_user, username, password, nama_lengkap, role, aktif, created_at, updated_at, email, akses_dashboard, kelola_user, akses_data_temuan, akses_form_inspeksi) VALUES (128, '100004', '$2b$10$eeQVjpT8z/1ffJlNecEUN.H2blI6et4Nec3dlGQuwpsJou8oWXrTe', 'Handoko Waskito', 'ADMIN_SISTEM_MUTU', true, '2026-09-13 10:19:00.211', '2026-09-13 10:21:59.124', NULL, true, false, false, true);


--
-- Name: users_id_user_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_user_seq', 129, true);


--
-- PostgreSQL database dump complete
--

\unrestrict GjYuCMtgoaLmWtMAeBh7bhEkTfsh0ht2jHgouU15IPPBcrBlzX1ZJblIoJ7iLdm


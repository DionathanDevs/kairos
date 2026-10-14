-- 003_seed_default_habits.sql
INSERT OR IGNORE INTO habits (id, title, description, color, order_index, created_at) VALUES
('habit-academia', 'Academia', 'Treino hipertrofia / força (50 min)', '#10b981', 0, '2026-10-13T00:00:00.000Z'),
('habit-creatina', 'Creatina', 'Dose diária de 5g', '#10b981', 1, '2026-10-13T00:00:00.000Z'),
('habit-dev', 'Estudos Desenvolvimento', '1h30 de código e projetos', '#10b981', 2, '2026-10-13T00:00:00.000Z'),
('habit-ingles', 'Estudos Inglês', '30 min de prática ativa', '#10b981', 3, '2026-10-13T00:00:00.000Z');

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  permissions TEXT NOT NULL DEFAULT '[]',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS owners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO classes (id, name, description) VALUES
  (1, 'Programación Web', 'HTML, CSS y JavaScript'),
  (2, 'Cálculo Integral', 'Límites, derivadas e integrales'),
  (3, 'Diseño UX', 'Investigación, prototipos y usabilidad');

INSERT OR IGNORE INTO admins (id, name, email, password, permissions) VALUES
  (1, 'Laura Gómez', 'laura@campus.com', '123456', '["createTeachers","createClasses","viewClasses","editClasses"]'),
  (2, 'Marco Ruiz', 'marco@campus.com', '123456', '["createClasses","viewClasses"]'),
  (3, 'Ana Torres', 'ana@campus.com', '123456', '["createTeachers","viewClasses"]');

INSERT OR IGNORE INTO teachers (id, name, email, password) VALUES
  (1, 'Carlos Ortega', 'profesor@campus.com', '123456');

INSERT OR IGNORE INTO owners (id, name, email, password) VALUES
  (1, 'Propietario', 'owner@campus.com', 'admin123');

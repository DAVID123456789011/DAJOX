const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "campus_nocturno.db");
const schemaSql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
const db = new sqlite3.Database(dbPath);

function runStatement(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
        return;
      }

      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function queryAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

async function initializeDatabase() {
  await new Promise((resolve, reject) => {
    db.exec(schemaSql, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });

  return db;
}

async function getAllClasses() {
  const rows = await queryAll("SELECT * FROM classes ORDER BY id ASC");
  return rows;
}

async function getAllAdmins() {
  const rows = await queryAll("SELECT * FROM admins ORDER BY id ASC");
  return rows.map((row) => ({
    ...row,
    permissions: JSON.parse(row.permissions || "[]")
  }));
}

async function createClass({ name, description }) {
  const result = await runStatement("INSERT INTO classes (name, description) VALUES (?, ?)", [name, description]);
  return { id: result.id, name, description };
}

async function createAdmin({ name, email, password, permissions = [] }) {
  const result = await runStatement(
    "INSERT INTO admins (name, email, password, permissions) VALUES (?, ?, ?, ?)",
    [name, email, password, JSON.stringify(permissions)]
  );

  return { id: result.id, name, email, permissions };
}

async function getTeacherByCredentials(email, password) {
  const rows = await queryAll("SELECT * FROM teachers WHERE email = ? AND password = ? LIMIT 1", [email, password]);
  return rows[0] || null;
}

async function getAdminByCredentials(email, password) {
  const rows = await queryAll("SELECT * FROM admins WHERE email = ? AND password = ? LIMIT 1", [email, password]);
  if (!rows[0]) return null;

  return {
    ...rows[0],
    permissions: JSON.parse(rows[0].permissions || "[]")
  };
}

async function getOwnerByCredentials(email, password) {
  const rows = await queryAll("SELECT * FROM owners WHERE email = ? AND password = ? LIMIT 1", [email, password]);
  return rows[0] || null;
}

module.exports = {
  initializeDatabase,
  getAllClasses,
  getAllAdmins,
  createClass,
  createAdmin,
  getTeacherByCredentials,
  getAdminByCredentials,
  getOwnerByCredentials,
  db
};

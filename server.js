const express = require("express");
const cors = require("cors");
const path = require("path");
const {
  initializeDatabase,
  getAllClasses,
  getAllAdmins,
  createClass,
  createAdmin,
  getTeacherByCredentials,
  getAdminByCredentials,
  getOwnerByCredentials
} = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get("/api/health", async (req, res) => {
  res.json({ ok: true, message: "Campus Nocturno connected to SQLite" });
});

app.get("/api/classes", async (req, res) => {
  try {
    const classes = await getAllClasses();
    res.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ error: "No se pudieron cargar las clases" });
  }
});

app.get("/api/admins", async (req, res) => {
  try {
    const admins = await getAllAdmins();
    res.json(admins);
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({ error: "No se pudieron cargar los administradores" });
  }
});

app.post("/api/classes", async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: "Nombre y descripción requeridos" });
    }

    const newClass = await createClass({ name, description });
    res.status(201).json(newClass);
  } catch (error) {
    console.error("Error creating class:", error);
    res.status(500).json({ error: "No se pudo crear la clase" });
  }
});

app.post("/api/admins", async (req, res) => {
  try {
    const { name, email, password, permissions = [] } = req.body;

    if (!name || !email || !password || !Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({ error: "Faltan datos o permisos" });
    }

    const admin = await createAdmin({ name, email, password, permissions });
    res.status(201).json(admin);
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({ error: "No se pudo crear el administrador" });
  }
});

app.post("/api/login/teacher", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Correo y contraseña requeridos" });
    }

    const user = await getTeacherByCredentials(email.trim(), password.trim());
    if (!user) {
      return res.status(401).json({ error: "Credenciales del profesor inválidas" });
    }

    return res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: "teacher" } });
  } catch (error) {
    console.error("Teacher login failed:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.post("/api/login/admin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Correo y contraseña requeridos" });
    }

    const user = await getAdminByCredentials(email.trim(), password.trim());
    if (!user) {
      return res.status(401).json({ error: "Credenciales del administrador inválidas" });
    }

    return res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: "admin", permissions: user.permissions } });
  } catch (error) {
    console.error("Admin login failed:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.post("/api/login/owner", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Correo y contraseña requeridos" });
    }

    const user = await getOwnerByCredentials(email.trim(), password.trim());
    if (!user) {
      return res.status(401).json({ error: "Credenciales del propietario inválidas" });
    }

    return res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: "owner" } });
  } catch (error) {
    console.error("Owner login failed:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  res.sendFile(path.join(__dirname, "index.html"));
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Campus Nocturno running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database initialization failed:", error);
    process.exit(1);
  });

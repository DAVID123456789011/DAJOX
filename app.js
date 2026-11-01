const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
const GMAIL_REGEX = /^[^\s@]+@gmail\.com$/i;
const API_BASE = "http://localhost:3000";

const permissionLabels = {
  createTeachers: "Crear cuentas de profesor",
  createClasses: "Crear clases",
  viewClasses: "Ver todas las clases",
  editClasses: "Editar clases"
};

const state = {
  currentRole: "student",
  userName: "Estudiante",
  selectedPersonalRole: "teacher",
  adminPermissions: ["createTeachers", "createClasses", "viewClasses", "editClasses"],
  ownerAdmins: [
    { id: 1, name: "Laura Gómez", email: "laura@campus.com", permissions: ["createTeachers", "createClasses", "viewClasses", "editClasses"] },
    { id: 2, name: "Marco Ruiz", email: "marco@campus.com", permissions: ["createClasses", "viewClasses"] },
    { id: 3, name: "Ana Torres", email: "ana@campus.com", permissions: ["createTeachers", "viewClasses"] }
  ],
  classes: [
    { id: 1, name: "Programación Web", description: "HTML, CSS y JavaScript" },
    { id: 2, name: "Cálculo Integral", description: "Límites, derivadas e integrales" },
    { id: 3, name: "Diseño UX", description: "Investigación, prototipos y usabilidad" }
  ],
  theme: "dark"
};

const ui = {
  authScreen: document.getElementById("auth-screen"),
  appScreen: document.getElementById("app-screen"),
  googleButton: document.getElementById("googleLoginBtn"),
  personalButton: document.getElementById("personalBtn"),
  personalPanel: document.getElementById("personalPanel"),
  closePersonalPanel: document.getElementById("closePersonalPanel"),
  personalForm: document.getElementById("personalForm"),
  personalEmail: document.getElementById("personalEmail"),
  personalPassword: document.getElementById("personalPassword"),
  themeToggle: document.getElementById("themeToggle"),
  logoutButton: document.getElementById("logoutBtn"),
  tabs: [...document.querySelectorAll(".tab")],
  views: [...document.querySelectorAll(".view-panel")],
  userBadge: document.getElementById("userBadge"),
  loginStatus: document.getElementById("loginStatus"),
  adminPermissionSections: document.getElementById("adminPermissionSections"),
  adminWelcome: document.getElementById("adminWelcome"),
  toastContainer: document.getElementById("toastContainer"),
  classForm: document.getElementById("classForm"),
  teacherClassList: document.getElementById("teacherClassList"),
  examForm: document.getElementById("examForm"),
  ownerAdminList: document.getElementById("ownerAdminList"),
  ownerClassList: document.getElementById("ownerClassList"),
  adminCreateForm: document.getElementById("adminCreateForm"),
  roleChoices: [...document.querySelectorAll(".role-choice")]
};

function showLoginStatus(message, isError = false) {
  if (!ui.loginStatus) return;
  ui.loginStatus.textContent = message;
  ui.loginStatus.classList.toggle("error", isError);
}

function showScreen(name) {
  const authVisible = name === "auth";
  ui.authScreen.classList.toggle("active", authVisible);
  ui.appScreen.classList.toggle("active", !authVisible);
}

function showToast(message, type = "success") {
  if (!ui.toastContainer) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  ui.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2200);
}

function setTheme(theme) {
  state.theme = theme;
  document.body.classList.toggle("theme-light", theme === "light");
  document.body.classList.toggle("theme-dark", theme === "dark");
  ui.themeToggle.textContent = theme === "dark" ? "🌙" : "☀️";
}

function getAdminPermissionsLabel(list) {
  return (list || []).map((key) => permissionLabels[key]).filter(Boolean);
}

function renderTeacherClasses() {
  if (!ui.teacherClassList) return;
  ui.teacherClassList.innerHTML = state.classes
    .map(
      (item) => `
        <div class="class-item">
          <strong>${item.name}</strong>
          <span>${item.description}</span>
        </div>
      `
    )
    .join("");
}

function renderOwnerClasses() {
  if (!ui.ownerClassList) return;
  ui.ownerClassList.innerHTML = state.classes
    .map(
      (item) => `
        <div class="class-item">
          <strong>${item.name}</strong>
          <span>${item.description}</span>
        </div>
      `
    )
    .join("");
}

async function loadDatabaseData() {
  try {
    const [classesResponse, adminsResponse] = await Promise.all([
      fetch(`${API_BASE}/api/classes`),
      fetch(`${API_BASE}/api/admins`)
    ]);

    if (classesResponse.ok) {
      const classes = await classesResponse.json();
      if (Array.isArray(classes) && classes.length) {
        state.classes = classes.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description || ""
        }));
      }
    }

    if (adminsResponse.ok) {
      const admins = await adminsResponse.json();
      if (Array.isArray(admins) && admins.length) {
        state.ownerAdmins = admins.map((admin) => ({
          id: admin.id,
          name: admin.name,
          email: admin.email,
          permissions: Array.isArray(admin.permissions) ? admin.permissions : JSON.parse(admin.permissions || "[]")
        }));
      }
    }
  } catch (error) {
    console.warn("Backend no disponible, usando datos locales:", error.message);
  }
}

function renderOwnerAdmins() {
  if (!ui.ownerAdminList) return;

  const adminCards = state.ownerAdmins
    .map(
      (admin) => `
        <div class="org-node org-admin">
          <div class="org-node-head">
            <span class="node-tag">👤</span>
            <span>${admin.name}</span>
          </div>
          <div class="node-meta">${admin.email}</div>
          <div class="tag-list">
            ${getAdminPermissionsLabel(admin.permissions)
              .map((permission) => `<span class="admin-tag">${permission}</span>`)
              .join("")}
          </div>
          <button class="mini-btn" type="button" data-admin-enter="${admin.id}">Entrar como</button>
        </div>
      `
    )
    .join("");

  ui.ownerAdminList.innerHTML = `
    <div class="org-chart">
      <div class="org-level top-level">
        <div class="org-node org-owner">
          <span class="node-tag">👑</span>
          <span>PROPIETARIO</span>
        </div>
      </div>
      <div class="org-level mid-level">
        ${adminCards}
      </div>
      <div class="org-level lower-level">
        ${Array.from({ length: 3 }, (_, index) => `
          <div class="org-node org-teacher">
            <div class="org-node-head">
              <span class="node-tag">📚</span>
              <span>PROFESOR ${index + 1}</span>
            </div>
            <div class="class-badges">
              <span class="class-badge">CLASES</span>
              <span class="class-badge">CLASES</span>
              <span class="class-badge">CLASES</span>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  ui.ownerAdminList.querySelectorAll("[data-admin-enter]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.adminEnter);
      const match = state.ownerAdmins.find((admin) => admin.id === id);
      if (!match) return;
      state.currentRole = "admin";
      state.adminPermissions = [...match.permissions];
      state.userName = match.name;
      setActiveTab("admin");
      showScreen("app");
      showToast(`Ingresaste como ${match.name}`, "success");
    });
  });
}

function renderAdminView() {
  if (!ui.adminPermissionSections) return;

  const permissions = [...state.adminPermissions];
  const sections = {
    createTeachers: {
      title: "Crear cuentas de profesor",
      description: "Genera nuevas credenciales para docentes con correo y contraseña.",
      content: `
        <div class="panel-card">
          <h3>Crear cuenta de profesor</h3>
          <form class="mini-form">
            <input type="text" placeholder="Nombre" />
            <input type="email" placeholder="Correo" />
            <input type="password" placeholder="Contraseña" />
            <button type="button">Crear cuenta</button>
          </form>
        </div>
      `
    },
    createClasses: {
      title: "Crear clases",
      description: "Diseña nuevas materias y asignaturas para el campus.",
      content: `
        <div class="panel-card">
          <h3>Crear clase</h3>
          <form class="mini-form">
            <input type="text" placeholder="Nombre de la clase" />
            <input type="text" placeholder="Descripción" />
            <button type="button">Crear clase</button>
          </form>
        </div>
      `
    },
    viewClasses: {
      title: "Ver todas las clases",
      description: "Consulta el listado completo de cursos vigentes.",
      content: `
        <div class="panel-card">
          <h3>Clases disponibles</h3>
          <div class="stack-list">
            ${state.classes
              .map(
                (item) => `
                  <div class="class-item">
                    <strong>${item.name}</strong>
                    <span>${item.description}</span>
                  </div>
                `
              )
              .join("")}
          </div>
        </div>
      `
    },
    editClasses: {
      title: "Editar clases",
      description: "Modifica el nombre y la descripción de las clases existentes.",
      content: `
        <div class="panel-card">
          <h3>Editar clases</h3>
          <div class="stack-list">
            ${state.classes
              .map(
                (item) => `
                  <div class="class-item">
                    <strong>${item.name}</strong>
                    <span>${item.description}</span>
                    <button class="mini-btn" type="button">Editar</button>
                  </div>
                `
              )
              .join("")}
          </div>
        </div>
      `
    }
  };

  const visible = Object.entries(sections).filter(([key]) => permissions.includes(key));

  if (!visible.length) {
    ui.adminPermissionSections.innerHTML = `
      <div class="panel-card">
        <h3>Sin permisos activos</h3>
        <p>Este administrador no tiene accesos habilitados por el propietario.</p>
      </div>
    `;
    return;
  }

  ui.adminPermissionSections.innerHTML = `
    <div class="org-chart org-chart-admin">
      <div class="org-level top-level">
        <div class="org-node org-admin">
          <span class="node-tag">👤</span>
          <span>ADMINISTRADOR</span>
        </div>
      </div>
      <div class="org-level mid-level">
        ${Array.from({ length: 3 }, (_, index) => `
          <div class="org-node org-teacher">
            <div class="org-node-head">
              <span class="node-tag">📚</span>
              <span>PROFESOR ${index + 1}</span>
            </div>
            <div class="class-badges">
              <span class="class-badge">CLASES</span>
              <span class="class-badge">CLASES</span>
              <span class="class-badge">CLASES</span>
            </div>
          </div>
        `).join("")}
      </div>
      <div class="org-level lower-level">
        ${visible
          .map(
            ([key, section]) => `
              <div class="org-node org-permission">
                <div class="org-node-head">
                  <span class="node-tag">⚙️</span>
                  <span>${section.title}</span>
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;

  ui.adminWelcome.textContent = `Rol activo: Administrador · Permisos asignados: ${visible.map(([, section]) => section.title).join(", ")}.`;
}

function setActiveTab(role) {
  state.currentRole = role;

  ui.tabs.forEach((tab) => {
    const active = tab.dataset.role === role;
    tab.classList.toggle("active", active);
  });

  ui.views.forEach((view) => {
    const active = view.dataset.roleView === role;
    view.classList.toggle("active", active);
  });

  if (role === "student") {
    ui.userBadge.textContent = `${state.userName} · Estudiante`;
  } else if (role === "teacher") {
    ui.userBadge.textContent = `${state.userName} · Profesor`;
  } else if (role === "admin") {
    ui.userBadge.textContent = `${state.userName} · Administrador`;
  } else if (role === "owner") {
    ui.userBadge.textContent = `${state.userName} · Propietario`;
  }

  if (role === "admin") {
    renderAdminView();
  }
}

function canUseGmail(email) {
  return typeof email === "string" && GMAIL_REGEX.test(email.trim());
}

function loginAsStudent(email) {
  if (!canUseGmail(email)) {
    showLoginStatus("Solo se permite iniciar sesión con una cuenta Gmail válida.", true);
    return false;
  }

  const normalizedEmail = email.trim();
  state.userName = normalizedEmail.split("@")[0] || "Estudiante";
  showLoginStatus("");
  setActiveTab("student");
  showScreen("app");
  return true;
}

async function loginAsRole(role, email, password) {
  if (!email || !password) {
    showLoginStatus("Completa correo y contraseña para continuar.", true);
    return false;
  }

  const normalizedEmail = email.trim();
  state.userName = normalizedEmail.split("@")[0] || "Usuario";

  try {
    const endpoint = role === "teacher" ? "/api/login/teacher" : role === "admin" ? "/api/login/admin" : "/api/login/owner";
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, password: password.trim() })
    });

    const payload = await response.json();

    if (!response.ok) {
      showLoginStatus(payload.error || "Credenciales inválidas.", true);
      return false;
    }

    if (role === "teacher") {
      state.currentRole = "teacher";
      state.userName = payload.user.name || normalizedEmail.split("@")[0];
      setActiveTab("teacher");
      showScreen("app");
      showLoginStatus("");
      showToast("Bienvenido, profesor", "success");
      return true;
    }

    if (role === "admin") {
      state.currentRole = "admin";
      state.userName = payload.user.name || "Administrador";
      state.adminPermissions = payload.user.permissions || ["viewClasses"];
      setActiveTab("admin");
      showScreen("app");
      showLoginStatus("");
      showToast("Bienvenido, administrador", "success");
      return true;
    }

    if (role === "owner") {
      state.currentRole = "owner";
      state.userName = payload.user.name || "Propietario";
      setActiveTab("owner");
      showScreen("app");
      showLoginStatus("");
      showToast("Bienvenido, propietario", "success");
      return true;
    }
  } catch (error) {
    showLoginStatus("No se pudo conectar con la base de datos.", true);
    console.error("Login request failed:", error);
    return false;
  }

  return false;
}

function loadGoogleClient() {
  if (window.google && window.google.accounts) {
    return;
  }

  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.defer = true;
  script.onload = () => {
    if (window.google && window.google.accounts && GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes("YOUR_")) {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          try {
            const payload = JSON.parse(
              atob(response.credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
            );
            const email = payload.email || "";
            loginAsStudent(email);
          } catch (error) {
            loginAsStudent("estudiante@gmail.com");
          }
        }
      });
    }
  };

  document.head.appendChild(script);
}

function handleGoogleLogin() {
  if (window.google && window.google.accounts && GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes("YOUR_")) {
    google.accounts.id.prompt();
    return;
  }

  loginAsStudent("estudiante@gmail.com");
}

function bindEvents() {
  ui.googleButton.addEventListener("click", handleGoogleLogin);

  ui.personalButton.addEventListener("click", () => {
    ui.personalPanel.classList.toggle("open");
    ui.personalPanel.setAttribute("aria-hidden", String(!ui.personalPanel.classList.contains("open")));
  });

  ui.closePersonalPanel.addEventListener("click", () => {
    ui.personalPanel.classList.remove("open");
    ui.personalPanel.setAttribute("aria-hidden", "true");
  });

  ui.roleChoices.forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedPersonalRole = button.dataset.personalRole;
      ui.roleChoices.forEach((choice) => choice.classList.toggle("active", choice === button));
      const placeholder = state.selectedPersonalRole === "teacher" ? "Correo del profesor" : state.selectedPersonalRole === "admin" ? "Correo del administrador" : "Correo del propietario";
      ui.personalEmail.placeholder = placeholder;
    });
  });

  ui.personalForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = ui.personalEmail.value;
    const password = ui.personalPassword.value;
    const role = state.selectedPersonalRole;
    const success = await loginAsRole(role, email, password);
    if (success) {
      ui.personalPanel.classList.remove("open");
      ui.personalForm.reset();
    }
  });

  ui.logoutButton.addEventListener("click", () => {
    showLoginStatus("");
    state.currentRole = "student";
    state.userName = "Estudiante";
    setActiveTab("student");
    showScreen("auth");
    showToast("Sesión cerrada", "success");
  });

  ui.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setActiveTab(tab.dataset.role);
    });
  });

  ui.themeToggle.addEventListener("click", () => {
    const nextTheme = state.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    showToast(`Tema ${nextTheme === "dark" ? "oscuro" : "claro"} activado`, "success");
  });

  ui.classForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.getElementById("className").value.trim();
    const description = document.getElementById("classDescription").value.trim();

    if (!name || !description) {
      showToast("Completa todos los campos de la clase", "error");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description })
      });

      if (!response.ok) {
        throw new Error("No se pudo crear la clase");
      }

      const newClass = await response.json();
      state.classes.push({ id: newClass.id, name: newClass.name, description: newClass.description });
      renderTeacherClasses();
      renderOwnerClasses();
      renderAdminView();
      ui.classForm.reset();
      showToast("Clase creada con éxito", "success");
    } catch (error) {
      state.classes.push({ id: Date.now(), name, description });
      renderTeacherClasses();
      renderOwnerClasses();
      renderAdminView();
      ui.classForm.reset();
      showToast("Clase creada con éxito", "success");
    }
  });

  ui.examForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const question = document.getElementById("examQuestion").value.trim();
    const options = [...document.querySelectorAll(".exam-option")].map((element) => element.value.trim());
    const correct = document.getElementById("correctAnswer").value;

    if (!question || options.some((opt) => !opt)) {
      showToast("Completa la pregunta y sus opciones", "error");
      return;
    }

    showToast(`Examen publicado: respuesta correcta ${correct}`, "success");
    ui.examForm.reset();
  });

  ui.adminCreateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.getElementById("ownerAdminName").value.trim();
    const email = document.getElementById("ownerAdminEmail").value.trim();
    const password = document.getElementById("ownerAdminPassword").value.trim();
    const selected = [...document.querySelectorAll("#adminCreateForm input[type='checkbox']:checked")].map((input) => input.value);

    if (!name || !email || !password || !selected.length) {
      showToast("Completa los datos y selecciona al menos un permiso", "error");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, permissions: selected })
      });

      if (!response.ok) {
        throw new Error("No se pudo crear el administrador");
      }

      const createdAdmin = await response.json();
      state.ownerAdmins.push({
        id: createdAdmin.id,
        name: createdAdmin.name,
        email: createdAdmin.email,
        permissions: createdAdmin.permissions || selected
      });
    } catch (error) {
      state.ownerAdmins.push({
        id: Date.now(),
        name,
        email,
        permissions: selected
      });
    }

    ui.adminCreateForm.reset();
    renderOwnerAdmins();
    showToast("Administrador creado", "success");
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  bindEvents();
  await loadDatabaseData();
  renderTeacherClasses();
  renderOwnerClasses();
  renderOwnerAdmins();
  loadGoogleClient();
  setTheme("dark");
  showScreen("auth");
  setActiveTab("student");
});

const { app, BrowserWindow, ipcMain, shell, session } = require("electron");
const path = require("path");
const fs = require("fs");
const https = require("https");
const http = require("http");
const { execFile } = require("child_process");

// ── Backend (obfuscated) ──────────────────────────────────────────────────────
const _b = Buffer.from("aHR0cDovLzI2LjI1Mi4xMjMuMjQzOjM1NTE=", "base64").toString();
function apiUrl(path) { return _b + path; }

// ── Config ────────────────────────────────────────────────────────────────────
const CFG_PATH = path.join(app.getPath("userData"), "config.json");
function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CFG_PATH, "utf8")); } catch { return {}; }
}
function saveConfig(c) { fs.writeFileSync(CFG_PATH, JSON.stringify(c, null, 2)); }

// ── HTTP helpers ──────────────────────────────────────────────────────────────
function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.request(url, options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function encodeForm(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function loginWithPassword(username, password) {
  const body = encodeForm({
    grant_type: "password",
    username,
    password,
    includePerms: true,
  });
  const res = await request(
    apiUrl("/account/api/oauth/token"),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "basic " + Buffer.from("ec684b8c687f479fadea3cb2ad83f5c6:e1f31c211f28413186262d37a13fc84d").toString("base64"),
        "Content-Length": Buffer.byteLength(body),
      },
    },
    body
  );
  if (res.status !== 200) {
    const msg = res.body?.errorMessage || res.body?.error_description || "Login failed";
    throw new Error(msg);
  }
  return res.body; // { access_token, account_id, displayName, ... }
}

async function getExchangeCode(accessToken) {
  const res = await request(apiUrl("/account/api/oauth/exchange"), {
    method: "GET",
    headers: { Authorization: `bearer ${accessToken}` },
  });
  if (res.status !== 200) throw new Error("Failed to get exchange code");
  return res.body.code;
}

async function fetchProfile(accessToken, accountId) {
  try {
    const res = await request(
      apiUrl(`/fortnite/api/game/v2/profile/${accountId}/client/QueryProfile?profileId=athena`),
      {
        method: "POST",
        headers: {
          Authorization: `bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
      JSON.stringify({})
    );
    return res.status === 200 ? res.body : null;
  } catch { return null; }
}

// ── Windows ───────────────────────────────────────────────────────────────────
let loginWin = null;
let mainWin = null;

function createLoginWindow() {
  loginWin = new BrowserWindow({
    width: 440,
    height: 540,
    resizable: false,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false,
    },
  });
  loginWin.loadFile(path.join(__dirname, "renderer", "login.html"));
  loginWin.on("closed", () => { loginWin = null; });
}

function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 1100,
    height: 680,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    transparent: false,
    backgroundColor: "#0d0d0f",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false,
    },
  });
  mainWin.loadFile(path.join(__dirname, "renderer", "index.html"));
  mainWin.on("closed", () => { mainWin = null; });
}

// ── IPC ───────────────────────────────────────────────────────────────────────
ipcMain.handle("login", async (_, { username, password }) => {
  try {
    const token = await loginWithPassword(username, password);
    const cfg = loadConfig();
    cfg.session = {
      accessToken: token.access_token,
      accountId: token.account_id,
      displayName: token.displayName || username,
    };
    saveConfig(cfg);
    return { ok: true, displayName: cfg.session.displayName, accountId: cfg.session.accountId };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle("get-session", () => {
  const cfg = loadConfig();
  return cfg.session || null;
});

ipcMain.handle("logout", () => {
  const cfg = loadConfig();
  delete cfg.session;
  saveConfig(cfg);
  return true;
});

ipcMain.handle("open-main", () => {
  if (loginWin && !loginWin.isDestroyed()) loginWin.close();
  createMainWindow();
});

ipcMain.handle("open-login", () => {
  if (mainWin && !mainWin.isDestroyed()) mainWin.close();
  createLoginWindow();
});

ipcMain.handle("launch-game", async () => {
  const cfg = loadConfig();
  if (!cfg.session) return { ok: false, error: "Not logged in" };
  if (!cfg.gamePath) return { ok: false, error: "Game path not set in settings" };
  try {
    const code = await getExchangeCode(cfg.session.accessToken);
    const exe = path.join(cfg.gamePath, "FortniteGame", "Binaries", "Win64", "FortniteClient-Win64-Shipping.exe");
    if (!fs.existsSync(exe)) return { ok: false, error: "Game executable not found" };

    const args = [
      `-AUTH_LOGIN=unused`,
      `-AUTH_PASSWORD=${code}`,
      `-AUTH_TYPE=epic`,
      `-epicapp=Fortnite`,
      `-epicenv=Prod`,
      `-epiclocale=en-us`,
      `-noeac`,
      `-nobe`,
      `-fromfl=be`,
      `-fltoken=none`,
      `-skippatchcheck`,
      `-notexturestreaming`,
    ];

    const proc = execFile(exe, args, { detached: true });
    proc.unref();

    // Inject patchers after 2s
    setTimeout(() => injectPatchers(cfg.gamePath), 2000);

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle("get-config", () => loadConfig());
ipcMain.handle("save-config", (_, c) => { saveConfig(c); return true; });
ipcMain.handle("window-minimize", (e) => BrowserWindow.fromWebContents(e.sender)?.minimize());
ipcMain.handle("window-maximize", (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (!win) return;
  win.isMaximized() ? win.unmaximize() : win.maximize();
});
ipcMain.handle("window-close", (e) => BrowserWindow.fromWebContents(e.sender)?.close());
ipcMain.handle("open-external", (_, url) => {
  if (/^https?:\/\//.test(url)) shell.openExternal(url);
});

ipcMain.handle("fetch-profile", async () => {
  const cfg = loadConfig();
  if (!cfg.session) return null;
  return await fetchProfile(cfg.session.accessToken, cfg.session.accountId);
});

// ── DLL Injection ─────────────────────────────────────────────────────────────
function injectPatchers(gamePath) {
  const win64 = path.join(gamePath, "FortniteGame", "Binaries", "Win64");
  const patchers = [
    path.join(__dirname, "patchers", "Tellurium.dll"),
    path.join(__dirname, "patchers", "Erbium.dll"),
    path.join(__dirname, "patchers", "Memory.dll"),
  ];
  const injector = path.join(__dirname, "patchers", "injector.exe");
  if (!fs.existsSync(injector)) return;
  for (const dll of patchers) {
    if (fs.existsSync(dll)) {
      execFile(injector, [dll, "FortniteClient-Win64-Shipping.exe"], (err) => {
        if (err) console.log("[inject] failed:", path.basename(dll));
      });
    }
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  // Block devtools globally
  app.on("web-contents-created", (_, wc) => {
    wc.on("before-input-event", (e, input) => {
      if (input.key === "F12" ||
         (input.control && input.shift && input.key === "I") ||
         (input.control && input.shift && input.key === "J")) {
        e.preventDefault();
      }
    });
    wc.setWindowOpenHandler(() => ({ action: "deny" }));
  });

  const cfg = loadConfig();
  if (cfg.session?.accessToken) {
    createMainWindow();
  } else {
    createLoginWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

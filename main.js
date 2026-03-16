const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

let mainWindow;

const CONFIG_PATH = path.join(app.getPath("userData"), "starglaze-config.json");

const DEFAULT_CONFIG = {
  gamePath: "",
  lastPlayed: null,
  backendUrl: "http://26.252.123.243:3551",
  accessToken: null,
  refreshToken: null,
  accountId: null,
  displayName: null,
  settings: {},
};

function loadConfig() {
  try {
    const saved = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    return { ...DEFAULT_CONFIG, ...saved };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 750,
    minWidth: 1000,
    minHeight: 650,
    frame: false,
    transparent: false,
    backgroundColor: "#08080C",
    titleBarStyle: "hidden",
    icon: path.join(__dirname, "assets", "logo.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile("renderer/index.html");
}

// IPC handlers
ipcMain.handle("select-game-path", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select Fortnite Build Folder",
  });
  if (!result.canceled && result.filePaths[0]) {
    const config = loadConfig();
    config.gamePath = result.filePaths[0];
    saveConfig(config);
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle("get-config", () => loadConfig());

ipcMain.handle("save-config", (_, config) => {
  const current = loadConfig();
  const merged = { ...current, ...config };
  saveConfig(merged);
  return merged;
});

ipcMain.handle("minimize-window", () => mainWindow.minimize());
ipcMain.handle("maximize-window", () => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.handle("close-window", () => mainWindow.close());

ipcMain.handle("open-external", (_, url) => {
  return shell.openExternal(url);
});

ipcMain.handle("launch-game", async (_, launchArgs) => {
  const config = loadConfig();
  if (!config.gamePath) return { success: false, error: "No game path set" };

  const exe = path.join(
    config.gamePath,
    "FortniteGame",
    "Binaries",
    "Win64",
    "FortniteClient-Win64-Shipping.exe"
  );

  if (!fs.existsSync(exe)) {
    return { success: false, error: "Fortnite executable not found" };
  }

  const args = launchArgs || [];

  try {
    const child = spawn(exe, args, {
      detached: true,
      stdio: "ignore",
    });
    child.unref();

    config.lastPlayed = new Date().toISOString();
    saveConfig(config);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());

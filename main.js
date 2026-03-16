const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;

const CONFIG_PATH = path.join(app.getPath("userData"), "starglaze-config.json");

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch {
    return { gamePath: "", lastPlayed: null, settings: {} };
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
ipcMain.handle("save-config", (_, config) => saveConfig(config));

ipcMain.handle("minimize-window", () => mainWindow.minimize());
ipcMain.handle("maximize-window", () => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.handle("close-window", () => mainWindow.close());

ipcMain.handle("launch-game", async () => {
  const config = loadConfig();
  if (!config.gamePath) return { success: false, error: "No game path set" };
  const exe = path.join(config.gamePath, "FortniteGame", "Binaries", "Win64", "FortniteClient-Win64-Shipping.exe");
  if (!fs.existsSync(exe)) return { success: false, error: "Fortnite executable not found" };
  config.lastPlayed = new Date().toISOString();
  saveConfig(config);
  return { success: true };
});

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());

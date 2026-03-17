const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const crypto = require("crypto");

let mainWindow;

// ===== Deep Link Protocol =====
app.setAsDefaultProtocolClient("starglaze");

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

function handleDeepLink(url) {
  if (!url || !url.startsWith("starglaze://")) return;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "auth") {
      const code = parsed.searchParams.get("code");
      const username = parsed.searchParams.get("username");
      if (code && mainWindow) {
        mainWindow.webContents.send("oauth-callback", { code, username });
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    }
  } catch {}
}

app.on("second-instance", (event, argv) => {
  const deepLinkArg = argv.find((arg) => arg.startsWith("starglaze://"));
  if (deepLinkArg) handleDeepLink(deepLinkArg);
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on("open-url", (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

const CONFIG_PATH = path.join(app.getPath("userData"), "starglaze-config.json");

const DEFAULT_CONFIG = {
  gamePath: "",
  lastPlayed: null,
  accessToken: null,
  refreshToken: null,
  accountId: null,
  displayName: null,
  builds: [],
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
  // Remove menu bar
  Menu.setApplicationMenu(null);

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

  // Disable devtools in production
  mainWindow.webContents.on("devtools-opened", () => {
    mainWindow.webContents.closeDevTools();
  });
}

// IPC handlers — Window controls
ipcMain.handle("minimize-window", () => mainWindow.minimize());
ipcMain.handle("maximize-window", () => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.handle("close-window", () => mainWindow.close());

ipcMain.handle("open-external", (_, url) => {
  return shell.openExternal(url);
});

// Config
ipcMain.handle("get-config", () => loadConfig());

ipcMain.handle("save-config", (_, config) => {
  const current = loadConfig();
  const merged = { ...current, ...config };
  saveConfig(merged);
  return merged;
});

// ===== BUILD MANAGEMENT =====

ipcMain.handle("import-build", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select Fortnite Build Folder",
  });
  if (result.canceled || !result.filePaths[0]) return null;

  const buildPath = result.filePaths[0];
  const exePath = path.join(buildPath, "FortniteGame", "Binaries", "Win64", "FortniteClient-Win64-Shipping.exe");

  if (!fs.existsSync(exePath)) {
    return { error: "FortniteClient-Win64-Shipping.exe not found in this folder. Make sure you selected the root Fortnite build folder." };
  }

  // Try to detect version from .manifest files or folder name
  let detectedVersion = null;
  try {
    const manifestDir = path.join(buildPath, "FortniteGame", "Binaries", "Win64");
    const files = fs.readdirSync(manifestDir);
    for (const f of files) {
      if (f.endsWith(".manifest")) {
        const content = fs.readFileSync(path.join(manifestDir, f), "utf8");
        const match = content.match(/(\d+\.\d+)/);
        if (match) { detectedVersion = match[1]; break; }
      }
    }
  } catch {}

  // Fallback: try to detect from folder name
  if (!detectedVersion) {
    const folderMatch = buildPath.match(/(\d+\.\d+)/);
    if (folderMatch) detectedVersion = folderMatch[1];
  }

  const buildId = crypto.randomUUID();

  return {
    id: buildId,
    path: buildPath,
    exePath,
    version: detectedVersion,
  };
});

ipcMain.handle("get-builds", () => {
  const config = loadConfig();
  return config.builds || [];
});

ipcMain.handle("remove-build", (_, buildId) => {
  const config = loadConfig();
  config.builds = (config.builds || []).filter((b) => b.id !== buildId);
  saveConfig(config);
  return config.builds;
});

// ===== LAUNCH GAME =====

ipcMain.handle("launch-game", async (_, { buildPath, accessToken, accountId, exchangeCode }) => {
  const exePath = path.join(buildPath, "FortniteGame", "Binaries", "Win64", "FortniteClient-Win64-Shipping.exe");

  if (!fs.existsSync(exePath)) return { success: false, error: "Game executable not found" };

  const args = [
    exchangeCode ? "-AUTH_LOGIN=unused" : `-AUTH_LOGIN=${accountId}@starglaze`,
    `-AUTH_PASSWORD=${exchangeCode || accessToken}`,
    `-AUTH_TYPE=epic`,
    `-epicapp=Fortnite`,
    `-epicenv=Prod`,
    `-epiclocale=en-us`,
    `-epicportal`,
    `-skippatchcheck`,
    `-nobe`,
    `-noeac`,
    `-fromfl=eac`,
    `-fltoken=hchc0906bb1bg83c3934fa31`,
    `-caldera=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiYmU5ZGE1YzJmYmVhNDQwN2IyZjQwZWJhYWQ4NTlhZDQiLCJnZW5lcmF0ZWQiOjE2Mzg3MTcyNzgsImNhbGRlcmFHdWlkIjoiMzgxMGI4NjMtMmE2NS00NDU3LTliNTgtNGRhYjNiNDgyYTg2IiwiYWNQcm92aWRlciI6IkVhc3lBbnRpQ2hlYXQiLCJub3RlcyI6IiIsImZhbGxiYWNrIjpmYWxzZX0.VAWQB67RTxhiWOxx7DBjnzDnXyyEnX7OljJm-j2d88G_WgwQ9wrE6lwMEHZHjBd1ISJdUO1UVUqkfLdU5nofBQ`,
  ];

  try {
    // Launch game — NO FortniteLauncher (triggers EAC), NO EAC exe
    const game = spawn(exePath, args, {
      detached: false, // keep handle so we can get PID for injection
      stdio: "ignore",
      cwd: path.dirname(exePath),
    });

    const gamePid = game.pid;
    game.unref();

    // Inject patchers after game initializes (5 second delay)
    if (gamePid) {
      const patcherDir = path.join(__dirname, "patchers");
      const tellurium = path.join(patcherDir, "Tellurium.dll").replace(/\\/g, "\\\\");
      const memory = path.join(patcherDir, "Memory.dll").replace(/\\/g, "\\\\");
      const erbium = path.join(patcherDir, "Erbium.dll").replace(/\\/g, "\\\\");

      setTimeout(() => {
        // PowerShell DLL injector — injects Tellurium (auth redirect), Memory, Erbium
        const ps = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Injector {
    [DllImport("kernel32.dll")] public static extern IntPtr OpenProcess(int a, bool b, int c);
    [DllImport("kernel32.dll")] public static extern IntPtr GetProcAddress(IntPtr h, string p);
    [DllImport("kernel32.dll")] public static extern IntPtr GetModuleHandle(string m);
    [DllImport("kernel32.dll")] public static extern IntPtr VirtualAllocEx(IntPtr h, IntPtr a, uint s, uint t, uint p);
    [DllImport("kernel32.dll")] public static extern bool WriteProcessMemory(IntPtr h, IntPtr a, byte[] b, uint s, out int w);
    [DllImport("kernel32.dll")] public static extern IntPtr CreateRemoteThread(IntPtr h, IntPtr a, uint s, IntPtr f, IntPtr p, uint c, IntPtr i);
    [DllImport("kernel32.dll")] public static extern bool CloseHandle(IntPtr h);
}
"@
function Inject([int]$pid,[string]$dll){
  $h=[Injector]::OpenProcess(0x1F0FFF,$false,$pid)
  $b=[System.Text.Encoding]::Unicode.GetBytes($dll+[char]0)
  $a=[Injector]::VirtualAllocEx($h,[IntPtr]::Zero,$b.Length,0x3000,0x40)
  $w=0;[Injector]::WriteProcessMemory($h,$a,$b,$b.Length,[ref]$w)|Out-Null
  $f=[Injector]::GetProcAddress([Injector]::GetModuleHandle("kernel32.dll"),"LoadLibraryW")
  [Injector]::CreateRemoteThread($h,[IntPtr]::Zero,0,$f,$a,0,[IntPtr]::Zero)|Out-Null
  [Injector]::CloseHandle($h)|Out-Null
}
Inject ${gamePid} "${tellurium}"
Start-Sleep -Milliseconds 500
Inject ${gamePid} "${memory}"
Start-Sleep -Milliseconds 500
Inject ${gamePid} "${erbium}"
`;
        spawn("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps], {
          detached: true, stdio: "ignore"
        }).unref();
      }, 5000);
    }

    // Update last played on the build
    const config = loadConfig();
    const build = (config.builds || []).find((b) => b.path === buildPath);
    if (build) {
      build.lastPlayed = new Date().toISOString();
      saveConfig(config);
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: "Failed to launch game" };
  }
});

// Legacy select-game-path (kept for settings compatibility)
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

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());

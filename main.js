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
  const launcherPath = path.join(buildPath, "FortniteGame", "Binaries", "Win64", "FortniteLauncher.exe");
  const eacPath = path.join(buildPath, "FortniteGame", "Binaries", "Win64", "FortniteClient-Win64-Shipping_EAC.exe");

  if (!fs.existsSync(exePath)) return { success: false, error: "Game executable not found" };

  // Auth: use username@projectreboot.dev style with "epic" type (same as Reboot launcher)
  // The username is the account's displayName, password is the access token
  const username = `${accountId}@projectreboot.dev`;
  const password = exchangeCode || accessToken;

  const args = [
    `-AUTH_LOGIN=${username}`,
    `-AUTH_PASSWORD=${password}`,
    `-AUTH_TYPE=epic`,
    `-epicapp=Fortnite`,
    `-epicenv=Prod`,
    `-epiclocale=en-us`,
    `-epicportal`,
    `-skippatchcheck`,
    `-nobe`,
    `-fromfl=eac`,
    `-fltoken=3db3ba5dcbd2e16703f3978d`,
    `-caldera=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiYmU5ZGE1YzJmYmVhNDQwN2IyZjQwZWJhYWQ4NTlhZDQiLCJnZW5lcmF0ZWQiOjE2Mzg3MTcyNzgsImNhbGRlcmFHdWlkIjoiMzgxMGI4NjMtMmE2NS00NDU3LTliNTgtNGRhYjNiNDgyYTg2IiwiYWNQcm92aWRlciI6IkVhc3lBbnRpQ2hlYXQiLCJub3RlcyI6IiIsImZhbGxiYWNrIjpmYWxzZX0.VAWQB67RTxhiWOxx7DBjnzDnXyyEnX7OljJm-j2d88G_WgwQ9wrE6lwMEHZHjBd1ISJdUO1UVUqkfLdU5nofBQ`,
  ];

  try {
    // Step 1: Spawn FortniteLauncher.exe suspended (so EAC can't run, but process exists)
    if (fs.existsSync(launcherPath)) {
      spawn("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command",
        `$p = Start-Process -FilePath '${launcherPath}' -PassThru; Start-Sleep -Milliseconds 100`
      ], { detached: true, stdio: "ignore" }).unref();
    }

    // Step 2: Spawn EAC suspended
    if (fs.existsSync(eacPath)) {
      spawn("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command",
        `$p = Start-Process -FilePath '${eacPath}' -PassThru; Start-Sleep -Milliseconds 100`
      ], { detached: true, stdio: "ignore" }).unref();
    }

    // Step 3: Spawn the game with OPENSSL env var (same as Reboot launcher)
    const game = spawn(exePath, args, {
      detached: false,
      stdio: "ignore",
      cwd: path.dirname(exePath),
      env: { ...process.env, OPENSSL_ia32cap: "~0x20000000" },
    });

    const gamePid = game.pid;
    game.unref();

    // Step 4: Inject Tellurium IMMEDIATELY (no delay — must be before game makes auth calls)
    if (gamePid) {
      const patcherDir = path.join(__dirname, "patchers");
      const tellurium = path.join(patcherDir, "Tellurium.dll").replace(/\\/g, "\\\\");
      const memory = path.join(patcherDir, "Memory.dll").replace(/\\/g, "\\\\");
      const erbium = path.join(patcherDir, "Erbium.dll").replace(/\\/g, "\\\\");

      // Inject immediately — Tellurium must intercept auth before game calls Epic servers
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
  $h=[Injector]::OpenProcess(0x43A,$false,$pid)
  $b=[System.Text.Encoding]::UTF8.GetBytes($dll+[char]0)
  $a=[Injector]::VirtualAllocEx($h,[IntPtr]::Zero,$b.Length+1,0x3000,0x4)
  $w=0;[Injector]::WriteProcessMemory($h,$a,$b,$b.Length,[ref]$w)|Out-Null
  $f=[Injector]::GetProcAddress([Injector]::GetModuleHandle("kernel32.dll"),"LoadLibraryA")
  [Injector]::CreateRemoteThread($h,[IntPtr]::Zero,0,$f,$a,0,[IntPtr]::Zero)|Out-Null
  [Injector]::CloseHandle($h)|Out-Null
}
Inject ${gamePid} "${tellurium}"
Start-Sleep -Milliseconds 200
Inject ${gamePid} "${memory}"
Start-Sleep -Milliseconds 200
Inject ${gamePid} "${erbium}"
`;
      spawn("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps], {
        detached: true, stdio: "ignore"
      }).unref();
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

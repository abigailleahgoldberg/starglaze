const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("starglaze", {
  // Window controls
  minimize: () => ipcRenderer.invoke("minimize-window"),
  maximize: () => ipcRenderer.invoke("maximize-window"),
  close: () => ipcRenderer.invoke("close-window"),
  openExternal: (url) => ipcRenderer.invoke("open-external", url),

  // Config
  getConfig: () => ipcRenderer.invoke("get-config"),
  saveConfig: (config) => ipcRenderer.invoke("save-config", config),

  // Builds
  importBuild: () => ipcRenderer.invoke("import-build"),
  getBuilds: () => ipcRenderer.invoke("get-builds"),
  removeBuild: (buildId) => ipcRenderer.invoke("remove-build", buildId),

  // Launch
  launchGame: (args) => ipcRenderer.invoke("launch-game", args),

  // Legacy
  selectGamePath: () => ipcRenderer.invoke("select-game-path"),

  // OAuth deep link callback
  onOAuthCallback: (callback) => ipcRenderer.on("oauth-callback", (_, data) => callback(data)),
});

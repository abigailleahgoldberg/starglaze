const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("starglaze", {
  selectGamePath: () => ipcRenderer.invoke("select-game-path"),
  getConfig: () => ipcRenderer.invoke("get-config"),
  saveConfig: (config) => ipcRenderer.invoke("save-config", config),
  launchGame: (args) => ipcRenderer.invoke("launch-game", args),
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  minimize: () => ipcRenderer.invoke("minimize-window"),
  maximize: () => ipcRenderer.invoke("maximize-window"),
  close: () => ipcRenderer.invoke("close-window"),
});

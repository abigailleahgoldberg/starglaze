const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("starglaze", {
  selectGamePath: () => ipcRenderer.invoke("select-game-path"),
  getConfig: () => ipcRenderer.invoke("get-config"),
  saveConfig: (config) => ipcRenderer.invoke("save-config", config),
  launchGame: () => ipcRenderer.invoke("launch-game"),
  minimize: () => ipcRenderer.invoke("minimize-window"),
  maximize: () => ipcRenderer.invoke("maximize-window"),
  close: () => ipcRenderer.invoke("close-window"),
});

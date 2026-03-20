const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("sg", {
  login:          (creds) => ipcRenderer.invoke("login", creds),
  getSession:     ()      => ipcRenderer.invoke("get-session"),
  logout:         ()      => ipcRenderer.invoke("logout"),
  openMain:       ()      => ipcRenderer.invoke("open-main"),
  openLogin:      ()      => ipcRenderer.invoke("open-login"),
  launchGame:     ()      => ipcRenderer.invoke("launch-game"),
  fetchProfile:   ()      => ipcRenderer.invoke("fetch-profile"),
  getConfig:      ()      => ipcRenderer.invoke("get-config"),
  saveConfig:     (c)     => ipcRenderer.invoke("save-config", c),
  windowMinimize: ()      => ipcRenderer.invoke("window-minimize"),
  windowMaximize: ()      => ipcRenderer.invoke("window-maximize"),
  windowClose:    ()      => ipcRenderer.invoke("window-close"),
  openExternal:   (url)   => ipcRenderer.invoke("open-external", url),
});

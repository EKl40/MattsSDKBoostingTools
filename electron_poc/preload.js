const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("msbt", {
  bridgeRequest: (args) => ipcRenderer.invoke("bridge:request", args),
  checkUpdates: () => ipcRenderer.invoke("app:checkUpdates"),
  mattEditorUrl: () => ipcRenderer.invoke("app:mattEditorUrl"),
  readResourceJson: (resourceName) => ipcRenderer.invoke("app:readResourceJson", resourceName),
  openExternal: (url) => ipcRenderer.invoke("app:openExternal", url)
});

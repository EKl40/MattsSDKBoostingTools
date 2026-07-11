const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");

const REPO_ROOT = path.resolve(__dirname, "..");
const DEFAULT_BRIDGE = "http://127.0.0.1:49774";
const SMOKE_MODE = process.argv.includes("--smoke");
const MATT_EDITOR_INDEX = path.join(
  REPO_ROOT,
  "external_app",
  "v22_parts_codes_fixed",
  "matt_editor",
  "index.html"
);

function createWindow() {
  const win = new BrowserWindow({
    width: 1500,
    height: 940,
    minWidth: 1120,
    minHeight: 760,
    backgroundColor: "#090d17",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.loadFile(path.join(__dirname, "renderer.html"));
}

async function requestBridge({ method = "GET", path: route = "/status", payload = null, timeoutMs = 8000 }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const body = payload === null || payload === undefined ? undefined : JSON.stringify(payload);
    const response = await fetch(DEFAULT_BRIDGE + route, {
      method,
      headers: { "Content-Type": "application/json" },
      body,
      signal: controller.signal
    });
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { ok: response.ok, message: text };
    }
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return { ok: false, status: 0, data: { ok: false, message: String(error && error.message ? error.message : error) } };
  } finally {
    clearTimeout(timer);
  }
}

ipcMain.handle("bridge:request", async (_event, args) => requestBridge(args || {}));

ipcMain.handle("app:mattEditorUrl", async () => pathToFileURL(MATT_EDITOR_INDEX).toString());

ipcMain.handle("app:openExternal", async (_event, url) => {
  await shell.openExternal(String(url || ""));
  return true;
});

app.whenReady().then(() => {
  if (SMOKE_MODE) {
    console.log(JSON.stringify({ ok: true, electron: process.versions.electron, bridge: DEFAULT_BRIDGE }));
    app.exit(0);
    return;
  }

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

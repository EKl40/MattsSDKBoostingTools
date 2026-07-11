# MSBT Electron Proof Of Concept

This folder is an isolated Electron test shell. It does not replace the current Tkinter app.

The first goal is to answer three questions:

1. Can Electron talk to the existing SDK bridge over HTTP?
2. Can Electron display a small MSBT control surface without importing SDK/game modules?
3. Can Electron render the vendored Mattmab editor assets inside the app shell?

## Run

From this folder:

```powershell
npm.cmd install
.\node_modules\electron\dist\electron.exe . --smoke
npm.cmd start
```

If PowerShell blocks `npm`, use `npm.cmd` exactly as shown.

If Electron says it failed to install correctly, approve its install script and rebuild it:

```powershell
npm.cmd approve-scripts electron
npm.cmd rebuild electron
```

## What This POC Tests

- `GET /status`
- `POST /action` with `give_serial_selected`
- `POST /action` with `give_serial_all`
- `POST /action` with `give_serial_nonhost`
- local Matt editor iframe loading from `external_app/v22_parts_codes_fixed/matt_editor/index.html`

## What This POC Does Not Do Yet

- It does not replace Tkinter.
- It does not package an Electron installer.
- It does not auto-update.
- It does not use the Python Matt editor host or adapter injection yet.
- It does not change the SDK mod or bridge.

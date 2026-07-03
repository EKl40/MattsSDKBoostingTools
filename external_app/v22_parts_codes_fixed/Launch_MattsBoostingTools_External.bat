@echo off
setlocal

set "APPDIR=%~dp0"

if exist "%APPDIR%MattsBoostingToolsExternal.exe" (
  start "" "%APPDIR%MattsBoostingToolsExternal.exe"
  exit /b 0
)

if exist "%APPDIR%matts_external_app_v22.pyw" (
  start "" "%APPDIR%matts_external_app_v22.pyw"
  exit /b 0
)

if exist "%APPDIR%matts_external_app_v22.py" (
  start "" pythonw "%APPDIR%matts_external_app_v22.py"
  exit /b 0
)

echo External app not found.
echo Expected MattsBoostingToolsExternal.exe beside this launcher.
pause
exit /b 1

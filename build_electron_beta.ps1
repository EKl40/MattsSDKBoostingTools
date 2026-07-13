param(
    [switch]$Installer
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ElectronRoot = Join-Path $RepoRoot "electron_poc"
$NodeModules = Join-Path $ElectronRoot "node_modules"
$OutputRoot = Join-Path $RepoRoot "dist_electron"

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,
        [string[]]$ArgumentList = @()
    )

    & $FilePath @ArgumentList
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code $LASTEXITCODE`: $FilePath $($ArgumentList -join ' ')"
    }
}

if (-not (Test-Path $NodeModules)) {
    throw "Electron dependencies are missing. Run 'npm.cmd install' inside electron_poc first."
}

Push-Location $RepoRoot
try {
    & (Join-Path $RepoRoot "build_sdkmod.ps1")
} finally {
    Pop-Location
}

$SdkMod = Join-Path $RepoRoot "MattsSDKBoostingTools.sdkmod"
if (-not (Test-Path $SdkMod)) {
    throw "MattsSDKBoostingTools.sdkmod was not produced by build_sdkmod.ps1."
}

if (Test-Path $OutputRoot) {
    Remove-Item -LiteralPath $OutputRoot -Recurse -Force
}

Push-Location $ElectronRoot
try {
    Invoke-Checked "npm.cmd" @("run", "check")
    if ($Installer) {
        Invoke-Checked "npm.cmd" @("run", "dist:win")
    } else {
        Invoke-Checked "npm.cmd" @("run", "pack")
    }
} finally {
    Pop-Location
}

Write-Host "Electron beta build complete."
Write-Host "Output folder: $OutputRoot"

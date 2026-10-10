# Loads the local Ollama models into memory so the first assistant question after a
# restart is not slow (a cold 14B model can take 45+ seconds, enough to hit timeouts).
# Safe to run any time; skips anything that is not installed or not local.
#
#   powershell -NoProfile -File scripts\warmup.ps1
param(
  [string]$OllamaUrl = 'http://localhost:11434',
  [int]$WaitSeconds = 60
)

$ErrorActionPreference = 'Stop'

if ($env:NVIDIA_BASE_URL -and $env:NVIDIA_BASE_URL -notmatch 'localhost|127\.0\.0\.1') {
  Write-Host "Default model is hosted ($env:NVIDIA_BASE_URL); nothing to warm up."
  exit 0
}

$deadline = (Get-Date).AddSeconds($WaitSeconds)
$installed = $null
while ((Get-Date) -lt $deadline -and -not $installed) {
  try {
    $installed = (Invoke-RestMethod -Uri "$OllamaUrl/api/tags" -TimeoutSec 3).models.name
  } catch {
    Start-Sleep -Seconds 2
  }
}
if (-not $installed) {
  Write-Host "Ollama did not respond at $OllamaUrl within $WaitSeconds s; skipping warm-up."
  exit 0
}

$wanted = @($env:NVIDIA_MODEL, 'qwen2.5:14b-instruct') | Where-Object { $_ } | Select-Object -Unique
foreach ($model in $wanted) {
  if ($installed -notcontains $model) {
    Write-Host "Skipping $model (not installed)."
    continue
  }
  $started = Get-Date
  try {
    $body = @{ model = $model; prompt = 'ok'; stream = $false; keep_alive = '30m'; options = @{ num_predict = 1 } } | ConvertTo-Json
    Invoke-RestMethod -Uri "$OllamaUrl/api/generate" -Method Post -Body $body -ContentType 'application/json' -TimeoutSec 180 | Out-Null
    Write-Host ("Warmed {0} in {1:N1}s" -f $model, ((Get-Date) - $started).TotalSeconds)
  } catch {
    Write-Host "Could not warm $model : $($_.Exception.Message)"
  }
}

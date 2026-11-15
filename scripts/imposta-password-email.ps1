# Inserisce la password della casella che invia le email (SMTP_USER) in .env.local, senza mostrarla a schermo.
$envFile = Join-Path $PSScriptRoot "..\.env.local"
$user = (Get-Content $envFile | Where-Object { $_ -match '^SMTP_USER=' } | Select-Object -First 1) -replace '^SMTP_USER=', ''
Write-Host ""
Write-Host "Scrivi o incolla la password della casella $user e premi Invio." -ForegroundColor Cyan
Write-Host "Mentre scrivi non vedrai nulla: e' normale." -ForegroundColor Cyan
$secure = Read-Host "Password" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try { $plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
$plain = $plain.Trim()

if ($plain.Length -lt 6) {
  Write-Host "La password sembra troppo corta ($($plain.Length) caratteri). Nessuna modifica fatta: riprova." -ForegroundColor Red
  exit 1
}

# Tra apici singoli i simboli come $ o # restano invariati; con un apice nella password si usano le virgolette.
if ($plain -notmatch "'") { $value = "'" + $plain + "'" }
else { $value = '"' + (($plain -replace '\\', '\\') -replace '"', '\"' -replace '\$', '\$') + '"' }

$lines = Get-Content $envFile
$found = $false
$lines = $lines | ForEach-Object {
  if ($_ -match '^SMTP_PASS=') { $found = $true; "SMTP_PASS=$value" } else { $_ }
}
if (-not $found) { $lines += "SMTP_PASS=$value" }
Set-Content -Path $envFile -Value $lines -Encoding utf8
Write-Host "Password salvata in .env.local. Puoi chiudere questa scheda e tornare alla chat." -ForegroundColor Green

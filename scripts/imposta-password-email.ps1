# Inserisce la "password per le app" di Gmail in .env.local senza mostrarla a schermo.
$envFile = Join-Path $PSScriptRoot "..\.env.local"
Write-Host ""
Write-Host "Incolla la password per le app di Google (16 lettere) e premi Invio." -ForegroundColor Cyan
Write-Host "Mentre incolli non vedrai nulla: e' normale." -ForegroundColor Cyan
$secure = Read-Host "Password" -AsSecureString
$plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
$plain = ($plain -replace '\s', '')

if ($plain.Length -lt 16) {
  Write-Host "La password sembra troppo corta ($($plain.Length) caratteri). Nessuna modifica fatta: riprova." -ForegroundColor Red
  exit 1
}

$lines = Get-Content $envFile
$found = $false
$lines = $lines | ForEach-Object {
  if ($_ -match '^SMTP_PASS=') { $found = $true; "SMTP_PASS=$plain" } else { $_ }
}
if (-not $found) { $lines += "SMTP_PASS=$plain" }
Set-Content -Path $envFile -Value $lines -Encoding utf8
Write-Host "Password salvata in .env.local. Puoi chiudere questa scheda e tornare alla chat." -ForegroundColor Green

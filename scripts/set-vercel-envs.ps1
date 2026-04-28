# set-vercel-envs.ps1
# Agrega variables de entorno a los 3 ambientes de Vercel
# Uso: .\scripts\set-vercel-envs.ps1 -Token "tu_vercel_token"

param(
    [Parameter(Mandatory=$true)]
    [string]$Token
)

$projectId = "arise-chatbot"
$teamSlug  = "ouroborusais-projects"

$envVars = @{
    "GEMINI_API_KEY"              = "AIzaSyDgwKoTLm6psIaIjZXsgDLwaw23syb5pwQ,AIzaSyA47NFaSMcQkFElxI7t7VcJFM_mWBAjU5s,AIzaSyDyWV1hkry4o5h3eJeEMDg27bS2gJ9LkUY,AIzaSyAurQt7hjpUls1deESM3WBPoTtA4SNxbKc,AIzaSyA-xj8ZgkzqhKvwHGxpCTf2UfYvobN0OVI,AIzaSyAuSazncQaz9lBcPyKaf2wHOEO0o3kA1Ag,AIzaSyBQ84m2FpyTc_sDhwFWTpEZFp72shPvOe4,AIzaSyBOavVHeRSSzHEPdBDwDOlD3tpT2fcc2BE"
    "WHATSAPP_ACCESS_TOKEN"       = "EAALwomPZBYfcBRKehk9SUXKZCIIlGX9Ey8er3RiUuDYsGbZC9h181ozfQO3rwPXovwqaJncLG0Vj8r5hZCu8ZCkgLdmbzgVdQpvw9pgOYqcMvR1LGNhj4tL7CgLK1ruofGDFd4WpA7N6b5qBzBLv2zl2aEBi5NAm0X1jBc9mLfJR62SUBeBylnw3NnxFPxQZDZD"
    "WHATSAPP_VERIFY_TOKEN"       = "quickship_wh_verify_meta_2026"
    "META_ACCESS_TOKEN"           = "EAF4xGYMmjMoBRS9RIXIsZCS4XYWp8SbGTrWAcSZCcg8JTRDA0eAp0YBJVrXZBHRApqbttYOs19KxSioyDZAufpknXVjZBM04j5DbILaMHiqmA3ZCLFXhMk5uZBKEw5QxnzSaGlQ5ky1ZBbU8zTHogqrJfZArtHZBQmRPTRYkC7GqnvZBflSNBwUfYLrpKZAaKlHICCIEqjQY"
    "META_VERIFY_TOKEN"           = "arise_diamond_v10.1"
    "MERCADOPAGO_ACCESS_TOKEN"    = "APP_USR-2914911603764436-012000-0792d30372fdda5f0ecc7bf4707e361d-644234104"
    "MERCADOPAGO_PUBLIC_KEY"      = "APP_USR-a7c735e0-096c-4fa5-b001-2de2bfb1de39"
    "MERCADOPAGO_CLIENT_ID"       = "2914911603764436"
    "MERCADOPAGO_CLIENT_SECRET"   = "Jq4Wp44Mhie3KXAGJrtByRwrLJXuZSmC"
    "ARISE_MASTER_SERVICE_KEY"    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvc3JhdnJmcGZlY2hhbmF0dWN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU1OTU0MywiZXhwIjoyMDkyMTM1NTQzfQ.Js-e68reqnKNC9q5B-YbRLqiY_XH9I7_Z-HgY-61qRU"
    "INTERNAL_API_KEY"            = "arise_diamond_b3b72b02f52519162a6222b11cfa4edf791520dc26f49416"
}

$targets = @("production", "preview", "development")
$headers = @{ "Authorization" = "Bearer $Token"; "Content-Type" = "application/json" }
$baseUrl = "https://api.vercel.com/v10/projects/$projectId/env?teamSlug=$teamSlug"

foreach ($name in $envVars.Keys) {
    $value = $envVars[$name]
    $body = @{
        key    = $name
        value  = $value
        type   = "encrypted"
        target = $targets
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $body
        Write-Host "✅ $name -> production, preview, development" -ForegroundColor Green
    } catch {
        $err = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($err.error.code -eq "ENV_ALREADY_EXISTS") {
            Write-Host "⚠️  $name ya existe - actualizando..." -ForegroundColor Yellow
            # Patch para actualizar
            $existingId = $err.error.envVarId
            if ($existingId) {
                Invoke-RestMethod -Uri "https://api.vercel.com/v10/projects/$projectId/env/$existingId`?teamSlug=$teamSlug" `
                    -Method PATCH -Headers $headers `
                    -Body (@{ value = $value; target = $targets } | ConvertTo-Json) | Out-Null
                Write-Host "   ✅ $name actualizado" -ForegroundColor Green
            }
        } else {
            Write-Host "❌ $name - Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "`n🚀 Listo! Todas las variables configuradas en los 3 ambientes." -ForegroundColor Cyan

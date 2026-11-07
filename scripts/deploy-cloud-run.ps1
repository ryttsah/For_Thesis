<#
Deploy the CocoAnalytica API to Google Cloud Run from the repository root.

Before running, create the two Secret Manager secrets described in DEPLOY.md:
  cocoanalytics-database-url
  cocoanalytics-jwt-secret

Example:
  .\scripts\deploy-cloud-run.ps1 -ProjectId "your-gcp-project" `
    -CorsOrigins "https://your-app.vercel.app,http://localhost:5173"
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$ProjectId,

    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$CorsOrigins,

    [string]$Region = "asia-southeast1",
    [string]$ServiceName = "cocoanalytics-api",
    [string]$DatabaseSecret = "cocoanalytics-database-url",
    [string]$JwtSecret = "cocoanalytics-jwt-secret"
)

$ErrorActionPreference = "Stop"
$repositoryRoot = Split-Path -Parent $PSScriptRoot

if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    throw "Google Cloud CLI is not installed. Install it, run 'gcloud auth login', then rerun this script."
}

Push-Location $repositoryRoot
try {
    gcloud config set project $ProjectId | Out-Host

    gcloud run deploy $ServiceName `
        --source . `
        --project $ProjectId `
        --region $Region `
        --platform managed `
        --allow-unauthenticated `
        --port 8000 `
        --memory 1Gi `
        --cpu 1 `
        --concurrency 1 `
        --min-instances 0 `
        --max-instances 1 `
        --timeout 120 `
        --set-env-vars "DEBUG=false,AUTO_CREATE_DB=false,CORS_ORIGINS=$CorsOrigins,ML_MODEL_PATH=/app/model_outputs/coconut_leaf_multilabel_cnn.keras,ML_LABEL_CONFIG_PATH=/app/model_outputs/label_config.json" `
        --set-secrets "DATABASE_URL=$DatabaseSecret:latest,JWT_SECRET=$JwtSecret:latest" | Out-Host

    $serviceUrl = gcloud run services describe $ServiceName `
        --project $ProjectId --region $Region --format "value(status.url)"
    Write-Host "Cloud Run URL: $serviceUrl"
    Write-Host "Verify: $serviceUrl/health"
    Write-Host "Verify model identity: $serviceUrl/predict/status"
}
finally {
    Pop-Location
}

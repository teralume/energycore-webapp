[CmdletBinding()]
param()

$ErrorActionPreference = 'Continue'

$projectId = 'university-energycorp'
$region = 'us-east1'
$service = 'energycore-platform'
$frontendUrl = 'https://university-energycorp.web.app'
$backendUrl = 'https://energycore-platform-vfvqevfzvq-ue.a.run.app'
$backendApiUrl = "$backendUrl/api/v1"
$oldRenderUrl = 'https://energycore-platform.onrender.com'
$webappRoot = Split-Path -Parent $PSScriptRoot
$distDirectory = Join-Path $webappRoot 'dist\energycore-webapp\browser'

function ConvertTo-PlainText {
    param([Parameter(Mandatory)][Security.SecureString]$SecureValue)

    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)

    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    }
}

function Get-HttpStatusFromException {
    param([Parameter(Mandatory)]$Exception)

    if ($null -ne $Exception.Response) {
        return [int]$Exception.Response.StatusCode
    }

    return 0
}

$testEmail = Read-Host 'Correo de prueba (Enter para portfolio.test@energycore.dev)'
if ([string]::IsNullOrWhiteSpace($testEmail)) {
    $testEmail = 'portfolio.test@energycore.dev'
}

$testPasswordSecure = Read-Host 'Contraseña del usuario de prueba' -AsSecureString
$testPassword = ConvertTo-PlainText -SecureValue $testPasswordSecure

try {
    $frontendResponse = $null
    $lastFrontendError = $null
    $frontendDeadline = (Get-Date).AddMinutes(5)

    do {
        try {
            $frontendResponse = Invoke-WebRequest `
                -Uri $frontendUrl `
                -UseBasicParsing `
                -TimeoutSec 30 `
                -ErrorAction Stop

            if ($frontendResponse.StatusCode -eq 200) {
                break
            }
        }
        catch {
            $frontendResponse = $null
            $lastFrontendError = $_.Exception.Message
        }

        Start-Sleep -Seconds 5
    } while ((Get-Date) -lt $frontendDeadline)

    if ($null -eq $frontendResponse -or $frontendResponse.StatusCode -ne 200) {
        throw "Firebase Hosting no quedó disponible después de cinco minutos: $lastFrontendError"
    }

    $spaResponse = Invoke-WebRequest `
        -Uri "$frontendUrl/iam/login" `
        -UseBasicParsing `
        -TimeoutSec 60 `
        -ErrorAction Stop

    $healthResponse = Invoke-WebRequest `
        -Uri "$backendApiUrl/health" `
        -UseBasicParsing `
        -TimeoutSec 300 `
        -ErrorAction Stop

    $corsResponse = Invoke-WebRequest `
        -Uri "$backendApiUrl/auth/sign-in" `
        -Method Options `
        -Headers @{
            Origin = $frontendUrl
            'Access-Control-Request-Method' = 'POST'
            'Access-Control-Request-Headers' = 'content-type'
        } `
        -UseBasicParsing `
        -TimeoutSec 120 `
        -ErrorAction Stop

    $loginBody = @{
        email = $testEmail
        password = $testPassword
    } | ConvertTo-Json

    $loginStatus = 0
    $jwtReturned = $false

    try {
        $loginResponse = Invoke-WebRequest `
            -Uri "$backendApiUrl/auth/sign-in" `
            -Method Post `
            -Headers @{ Origin = $frontendUrl } `
            -ContentType 'application/json' `
            -Body $loginBody `
            -UseBasicParsing `
            -TimeoutSec 300 `
            -ErrorAction Stop

        $loginStatus = $loginResponse.StatusCode
        $loginResult = $loginResponse.Content | ConvertFrom-Json
        $tokenValue = @(
            $loginResult.accessToken
            $loginResult.token
            $loginResult.jwt
        ) |
            Where-Object {
                -not [string]::IsNullOrWhiteSpace([string]$_)
            } |
            Select-Object -First 1

        $jwtReturned = -not [string]::IsNullOrWhiteSpace([string]$tokenValue)
    }
    catch {
        $loginStatus = Get-HttpStatusFromException -Exception $_.Exception
    }

    $scriptMatches = [regex]::Matches(
        $frontendResponse.Content,
        '<script[^>]+src="([^"]+\.js)"',
        [Text.RegularExpressions.RegexOptions]::IgnoreCase
    )

    $deployedJavascript = @(
        foreach ($match in $scriptMatches) {
            $scriptUrl = [Uri]::new([Uri]$frontendUrl, $match.Groups[1].Value).AbsoluteUri
            (Invoke-WebRequest `
                -Uri $scriptUrl `
                -UseBasicParsing `
                -TimeoutSec 60 `
                -ErrorAction Stop).Content
        }
    ) -join "`n"

    $cloudRunUrlEmbedded = $deployedJavascript.Contains($backendApiUrl)
    $oldRenderUrlEmbedded = $deployedJavascript.Contains($oldRenderUrl)

    $serviceJson = (
        gcloud run services describe $service `
            --project=$projectId `
            --region=$region `
            --format=json
    ) | Out-String

    if ($LASTEXITCODE -ne 0) {
        throw 'No se pudo verificar la configuración de Cloud Run.'
    }

    $serviceConfiguration = $serviceJson | ConvertFrom-Json
    $serviceAnnotations = $serviceConfiguration.metadata.annotations
    $revisionAnnotations = $serviceConfiguration.spec.template.metadata.annotations
    $containerConfiguration = $serviceConfiguration.spec.template.spec.containers[0]

    $actualMinInstances = $serviceAnnotations.'run.googleapis.com/minScale'
    if ([string]::IsNullOrWhiteSpace([string]$actualMinInstances)) {
        $actualMinInstances = $revisionAnnotations.'autoscaling.knative.dev/minScale'
    }
    if ([string]::IsNullOrWhiteSpace([string]$actualMinInstances)) {
        $actualMinInstances = 0
    }

    $actualMaxInstances = $serviceAnnotations.'run.googleapis.com/maxScale'
    if ([string]::IsNullOrWhiteSpace([string]$actualMaxInstances)) {
        $actualMaxInstances = $revisionAnnotations.'autoscaling.knative.dev/maxScale'
    }

    $deployedFiles = @(
        Get-ChildItem -LiteralPath $distDirectory -File -Recurse
    )
    $firebaseConfiguration = (
        Get-Content -LiteralPath (Join-Path $webappRoot 'firebase.json') -Raw
    ) | ConvertFrom-Json
    $firebaseConfigurationKeys = @(
        $firebaseConfiguration.PSObject.Properties.Name
    )

    [PSCustomObject]@{
        ProjectId             = $projectId
        FrontendUrl           = $frontendUrl
        BackendUrl            = $backendUrl
        FrontendStatus        = $frontendResponse.StatusCode
        SpaLoginRouteStatus   = $spaResponse.StatusCode
        BackendHealthStatus   = $healthResponse.StatusCode
        CorsAllowedOrigin     = [string]$corsResponse.Headers['Access-Control-Allow-Origin']
        LoginStatus           = $loginStatus
        JwtReturned           = $jwtReturned
        CloudRunUrlEmbedded   = $cloudRunUrlEmbedded
        OldRenderUrlEmbedded  = $oldRenderUrlEmbedded
        HostingOnly           = (
            $firebaseConfigurationKeys.Count -eq 1 -and
            $firebaseConfigurationKeys[0] -eq 'hosting'
        )
        DeployedFileCount     = $deployedFiles.Count
        DeployedBytes         = ($deployedFiles | Measure-Object Length -Sum).Sum
        ActualMinInstances    = $actualMinInstances
        ActualMaxInstances    = $actualMaxInstances
        ActualCpu             = $containerConfiguration.resources.limits.cpu
        ActualMemory          = $containerConfiguration.resources.limits.memory
        ActualCpuThrottling   = $revisionAnnotations.'run.googleapis.com/cpu-throttling'
        ActualStartupCpuBoost = $revisionAnnotations.'run.googleapis.com/startup-cpu-boost'
        ActualConcurrency     = $serviceConfiguration.spec.template.spec.containerConcurrency
        TestUserEmail         = $testEmail
    } | Format-List
}
finally {
    $testPassword = $null
    $testPasswordSecure.Dispose()
}

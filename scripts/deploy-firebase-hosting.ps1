[CmdletBinding()]
param()

$ErrorActionPreference = 'Continue'

$projectId = 'university-energycorp'
$region = 'us-east1'
$service = 'energycore-platform'
$firebaseToolsVersion = '15.15.0'
$frontendUrl = 'https://university-energycorp.web.app'
$backendUrl = 'https://energycore-platform-vfvqevfzvq-ue.a.run.app'
$backendApiUrl = "$backendUrl/api/v1"
$oldRenderUrl = 'https://energycore-platform.onrender.com'
$webappRoot = Split-Path -Parent $PSScriptRoot
$distDirectory = Join-Path $webappRoot 'dist\energycore-webapp\browser'

function Assert-NativeCommand {
    param([Parameter(Mandatory)][string]$Message)

    if ($LASTEXITCODE -ne 0) {
        throw $Message
    }
}

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

function Invoke-FirebaseCli {
    param(
        [Parameter(Mandatory)]
        [string[]]$Arguments
    )

    & npx --yes "firebase-tools@$firebaseToolsVersion" @Arguments
}

function Get-HttpStatusFromException {
    param([Parameter(Mandatory)]$Exception)

    if ($null -ne $Exception.Response) {
        return [int]$Exception.Response.StatusCode
    }

    return 0
}

if (-not (Test-Path -LiteralPath $webappRoot)) {
    throw "No se encontró el frontend: $webappRoot"
}

$testEmail = Read-Host 'Correo de prueba (Enter para portfolio.test@energycore.dev)'
if ([string]::IsNullOrWhiteSpace($testEmail)) {
    $testEmail = 'portfolio.test@energycore.dev'
}

$testPasswordSecure = Read-Host 'Contraseña que usaste al desplegar Cloud Run' -AsSecureString
$testPassword = ConvertTo-PlainText -SecureValue $testPasswordSecure

try {
    Set-Location -LiteralPath $webappRoot

    npm test -- --watch=false
    Assert-NativeCommand 'Las pruebas del frontend fallaron.'

    npm run build
    Assert-NativeCommand 'La compilación productiva de Angular falló.'

    if (-not (Test-Path -LiteralPath $distDirectory)) {
        throw "No existe el directorio de salida esperado: $distDirectory"
    }

    $javascriptFiles = @(
        Get-ChildItem -LiteralPath $distDirectory `
            -Filter '*.js' `
            -File `
            -Recurse
    )

    if ($javascriptFiles.Count -eq 0) {
        throw 'La compilación no produjo archivos JavaScript.'
    }

    $cloudRunUrlEmbedded = $null -ne (
        Select-String `
            -LiteralPath $javascriptFiles.FullName `
            -SimpleMatch `
            -Pattern $backendApiUrl `
            -List |
        Select-Object -First 1
    )

    $oldRenderUrlEmbedded = $null -ne (
        Select-String `
            -LiteralPath $javascriptFiles.FullName `
            -SimpleMatch `
            -Pattern $oldRenderUrl `
            -List |
        Select-Object -First 1
    )

    if (-not $cloudRunUrlEmbedded) {
        throw 'El bundle no contiene la URL productiva de Cloud Run.'
    }

    if ($oldRenderUrlEmbedded) {
        throw 'El bundle todavía contiene la URL antigua de Render.'
    }

    foreach ($requiredFile in @('.firebaserc', 'firebase.json')) {
        if (-not (Test-Path -LiteralPath (Join-Path $webappRoot $requiredFile))) {
            throw "Falta la configuración requerida $requiredFile."
        }
    }

    $activeAccount = (
        gcloud auth list `
            --filter='status:ACTIVE' `
            --format='value(account)'
    ).Trim()

    Assert-NativeCommand 'No se pudo consultar la cuenta activa de gcloud.'

    if ([string]::IsNullOrWhiteSpace($activeAccount)) {
        throw 'gcloud no tiene una cuenta activa.'
    }

    $firebaseRoles = @(
        'roles/firebase.editor',
        'roles/firebasehosting.admin',
        'roles/serviceusage.apiKeysViewer'
    )

    foreach ($role in $firebaseRoles) {
        gcloud projects add-iam-policy-binding $projectId `
            --member="user:$activeAccount" `
            --role=$role `
            --quiet | Out-Null

        Assert-NativeCommand "No se pudo asignar el rol requerido $role."
    }

    $firebaseLoginList = (
        Invoke-FirebaseCli -Arguments @('login:list')
    ) | Out-String

    if ($LASTEXITCODE -ne 0 -or $firebaseLoginList -notmatch '@') {
        Invoke-FirebaseCli -Arguments @('login')
        Assert-NativeCommand 'No se pudo autenticar Firebase CLI.'
    }

    $firebaseProjectsJson = (
        Invoke-FirebaseCli -Arguments @(
            'projects:list',
            '--json',
            '--non-interactive'
        )
    ) | Out-String

    Assert-NativeCommand 'No se pudo consultar la lista de proyectos Firebase.'

    $firebaseProjectsPayload = $firebaseProjectsJson | ConvertFrom-Json
    $firebaseProjects = @($firebaseProjectsPayload.result)
    $firebaseAlreadyEnabled = $null -ne (
        $firebaseProjects |
        Where-Object { $_.projectId -eq $projectId } |
        Select-Object -First 1
    )

    if (-not $firebaseAlreadyEnabled) {
        Invoke-FirebaseCli -Arguments @(
            'projects:addfirebase',
            $projectId,
            '--non-interactive'
        )

        Assert-NativeCommand 'No se pudo añadir Firebase al proyecto GCP.'
    }
    else {
        Write-Host "Firebase ya estaba habilitado en $projectId."
    }

    Invoke-FirebaseCli -Arguments @(
        'deploy',
        '--only',
        'hosting',
        '--project',
        $projectId,
        '--non-interactive'
    )

    Assert-NativeCommand 'El despliegue de Firebase Hosting falló.'

    $frontendResponse = Invoke-WebRequest `
        -Uri $frontendUrl `
        -UseBasicParsing `
        -TimeoutSec 120 `
        -ErrorAction Stop

    $spaResponse = Invoke-WebRequest `
        -Uri "$frontendUrl/iam/login" `
        -UseBasicParsing `
        -TimeoutSec 120 `
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

    $serviceJson = (
        gcloud run services describe $service `
            --project=$projectId `
            --region=$region `
            --format=json
    ) | Out-String

    Assert-NativeCommand 'No se pudo verificar la configuración de Cloud Run.'

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

    [PSCustomObject]@{
        ProjectId              = $projectId
        FrontendUrl            = $frontendUrl
        BackendUrl             = $backendUrl
        FrontendStatus         = $frontendResponse.StatusCode
        SpaLoginRouteStatus    = $spaResponse.StatusCode
        BackendHealthStatus    = $healthResponse.StatusCode
        CorsAllowedOrigin      = [string]$corsResponse.Headers['Access-Control-Allow-Origin']
        LoginStatus            = $loginStatus
        JwtReturned            = $jwtReturned
        CloudRunUrlEmbedded    = $cloudRunUrlEmbedded
        OldRenderUrlEmbedded   = $oldRenderUrlEmbedded
        HostingOnly            = $true
        DeployedFileCount      = $deployedFiles.Count
        DeployedBytes          = ($deployedFiles | Measure-Object Length -Sum).Sum
        ActualMinInstances     = $actualMinInstances
        ActualMaxInstances     = $actualMaxInstances
        ActualCpu              = $containerConfiguration.resources.limits.cpu
        ActualMemory           = $containerConfiguration.resources.limits.memory
        ActualCpuThrottling    = $revisionAnnotations.'run.googleapis.com/cpu-throttling'
        ActualStartupCpuBoost  = $revisionAnnotations.'run.googleapis.com/startup-cpu-boost'
        ActualConcurrency      = $serviceConfiguration.spec.template.spec.containerConcurrency
        TestUserEmail          = $testEmail
    } | Format-List
}
finally {
    $testPassword = $null
    $testPasswordSecure.Dispose()
}

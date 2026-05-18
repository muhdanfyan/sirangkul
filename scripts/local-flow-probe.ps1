param(
    [string]$BaseUrl = "http://127.0.0.1:8000",
    [string]$Password = "Password123!"
)

$ErrorActionPreference = "Stop"

$bidangs = @(
    @{ Name = "Pendidikan"; Slug = "pendidikan" },
    @{ Name = "HUMAS"; Slug = "humas" },
    @{ Name = "Sarana dan Prasarana"; Slug = "sarpras" },
    @{ Name = "Sekretariat Komite"; Slug = "sekretariat" }
)

$tmpDir = Join-Path (Get-Location) "api-sirangkul\storage\framework\testing\local-http-flow"
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Path,
        [string]$Token = "",
        [object]$Body = $null
    )

    $headers = @{ Accept = "application/json" }
    if ($Token) {
        $headers.Authorization = "Bearer $Token"
    }

    $params = @{
        Uri = "$BaseUrl$Path"
        Method = $Method
        Headers = $headers
    }

    if ($null -ne $Body) {
        $params.ContentType = "application/json"
        $params.Body = ($Body | ConvertTo-Json -Depth 20 -Compress)
    }

    try {
        return Invoke-RestMethod @params
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        $responseBody = ""
        if ($_.Exception.Response) {
            $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
        }
        throw "HTTP $Method $Path failed with $status. $responseBody"
    }
}

function Invoke-Status {
    param(
        [string]$Path,
        [string]$Token,
        [string]$OutputPath = "NUL",
        [string]$Method = "GET"
    )

    $code = & curl.exe -sS -X $Method -o $OutputPath -w "%{http_code}" -H "Accept: application/json" -H "Authorization: Bearer $Token" "$BaseUrl$Path"
    if ($LASTEXITCODE -ne 0) {
        throw "curl failed for $Path"
    }

    return "$code"
}

function Write-GzipFile {
    param(
        [string]$Path,
        [string]$Text
    )

    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
    $stream = [System.IO.File]::Create($Path)
    try {
        $gzip = [System.IO.Compression.GzipStream]::new($stream, [System.IO.Compression.CompressionMode]::Compress)
        try {
            $gzip.Write($bytes, 0, $bytes.Length)
        } finally {
            $gzip.Dispose()
        }
    } finally {
        $stream.Dispose()
    }
}

function TokenFor {
    param([string]$Email)

    $php = @"
chdir('api-sirangkul');
require 'vendor/autoload.php';
`$app = require 'bootstrap/app.php';
`$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
`$user = \App\Models\User::where('email', '$Email')->firstOrFail();
`$user->tokens()->where('name', 'local-flow-probe')->delete();
echo `$user->createToken('local-flow-probe')->plainTextToken;
"@

    $token = & php -r $php

    if ($LASTEXITCODE -ne 0 -or -not $token) {
        throw "Token creation failed for $Email"
    }

    return "$token"
}

function Upload-ProposalAttachment {
    param(
        [string]$Token,
        [string]$ProposalId,
        [string]$Slug
    )

    $originalName = "flow-http-$Slug.pdf"
    $gzPath = Join-Path $tmpDir "$originalName.gz"
    Write-GzipFile -Path $gzPath -Text "%PDF-1.4`nFlow HTTP $Slug`n%%EOF"

    $json = & curl.exe -sS -X POST "$BaseUrl/proposals/$ProposalId/attachments" `
        -H "Authorization: Bearer $Token" `
        -H "Accept: application/json" `
        -F "files[]=@$gzPath;filename=$originalName.gz;type=application/gzip" `
        -F "original_names[]=$originalName" `
        -F "mime_types[]=application/pdf" `
        -F "file_sizes[]=2048" `
        -F "attachment_types[]=proposal"

    if ($LASTEXITCODE -ne 0) {
        throw "Attachment upload curl failed for $Slug"
    }

    $response = $json | ConvertFrom-Json
    if (-not $response.success) {
        throw "Attachment upload failed for $Slug. $json"
    }

    return $response.data[0]
}

function Process-Payment {
    param(
        [string]$Token,
        [string]$ProposalId,
        [string]$Slug
    )

    $originalName = "payment-proof-$Slug.pdf"
    $gzPath = Join-Path $tmpDir "$originalName.gz"
    Write-GzipFile -Path $gzPath -Text "%PDF-1.4`nPayment proof $Slug`n%%EOF"

    $json = & curl.exe -sS -X POST "$BaseUrl/payments/$ProposalId/process" `
        -H "Authorization: Bearer $Token" `
        -H "Accept: application/json" `
        -F "recipient_name=Penerima Flow $Slug" `
        -F "recipient_account=1234567890" `
        -F "bank_name=BSI" `
        -F "payment_method=transfer" `
        -F "payment_reference=FLOW-$Slug" `
        -F "notes=Pembayaran flow HTTP $Slug" `
        -F "payment_proof_file=@$gzPath;filename=$originalName.gz;type=application/gzip" `
        -F "proof_original_name=$originalName" `
        -F "proof_original_size=2048"

    if ($LASTEXITCODE -ne 0) {
        throw "Payment process curl failed for $Slug"
    }

    $response = $json | ConvertFrom-Json
    if (-not $response.success) {
        throw "Payment process failed for $Slug. $json"
    }

    return $response.data.payment_id
}

function Assert-DownloadOk {
    param(
        [string]$Token,
        [string]$AttachmentId,
        [string]$Label
    )

    $output = Join-Path $tmpDir "$Label.download"
    $code = Invoke-Status -Path "/attachments/$AttachmentId/download" -Token $Token -OutputPath $output
    if ($code -ne "200") {
        throw "Attachment download failed for $Label with HTTP $code"
    }
    if ((Get-Item $output).Length -le 0) {
        throw "Attachment download for $Label produced empty file"
    }
}

function Assert-Forbidden {
    param(
        [string]$Token,
        [string]$Path,
        [string]$Label,
        [string]$Method = "GET"
    )

    $code = Invoke-Status -Path $Path -Token $Token -Method $Method
    if ($code -ne "403") {
        throw "$Label expected 403 but got $code"
    }
}

$adminToken = TokenFor -Email "flowtest.admin@sirangkul.test"
$kepalaToken = TokenFor -Email "kepala@madrasah.com"
$bendaharaToken = TokenFor -Email "flowtest.bendahara@sirangkul.test"

foreach ($bidang in $bidangs) {
    $name = $bidang.Name
    $slug = $bidang.Slug

    $pengusulToken = TokenFor -Email "flowtest.pengusul.$slug@sirangkul.test"
    $verifikatorToken = TokenFor -Email "flowtest.verifikator.$slug@sirangkul.test"
    $komiteToken = TokenFor -Email "flowtest.komite.$slug@sirangkul.test"
    $otherSlug = ($bidangs | Where-Object { $_.Slug -ne $slug } | Select-Object -First 1).Slug
    $otherVerifikatorToken = TokenFor -Email "flowtest.verifikator.$otherSlug@sirangkul.test"
    $otherKomiteToken = TokenFor -Email "flowtest.komite.$otherSlug@sirangkul.test"

    $search = [System.Uri]::EscapeDataString("Flow Test RKAM $name")
    $rkams = Invoke-Api -Method "GET" -Path "/rkam?search=$search&no_paginate=true" -Token $adminToken
    $rkam = @($rkams.data | Where-Object { $_.item_name -eq "Flow Test RKAM $name" } | Select-Object -First 1)[0]
    if (-not $rkam.id) {
        throw "RKAM not found for $name"
    }

    $proposal = Invoke-Api -Method "POST" -Path "/proposals" -Token $pengusulToken -Body @{
        rkam_id = $rkam.id
        title = "HTTP Flow Proposal $name $(Get-Date -Format 'yyyyMMddHHmmss')"
        description = "HTTP flow test untuk $name"
        jumlah_pengajuan = 1000000
        urgency = "Normal"
    }
    if ($proposal.data.status -ne "draft") {
        throw "Proposal creation failed for $name"
    }

    $proposalId = $proposal.data.id
    $attachment = Upload-ProposalAttachment -Token $pengusulToken -ProposalId $proposalId -Slug $slug
    $attachmentId = $attachment.id

    $submit = Invoke-Api -Method "POST" -Path "/proposals/$proposalId/submit" -Token $pengusulToken
    if ($submit.data.status -ne "submitted") {
        throw "Submit failed for $name"
    }

    Assert-DownloadOk -Token $verifikatorToken -AttachmentId $attachmentId -Label "$slug-verifikator"
    Assert-Forbidden -Token $otherVerifikatorToken -Path "/attachments/$attachmentId/download" -Label "$slug other verifikator attachment"
    $reject = Invoke-Api -Method "POST" -Path "/proposals/$proposalId/reject" -Token $verifikatorToken -Body @{
        rejection_reason = "Reject verifikator HTTP"
        improvement_suggestions = "Perbaikan dari verifikator pada flow HTTP."
    }
    if ($reject.data.status -ne "rejected") {
        throw "Verifikator reject failed for $name"
    }

    Invoke-Api -Method "PUT" -Path "/proposals/$proposalId" -Token $pengusulToken -Body @{
        description = "Perbaikan setelah reject verifikator"
    } | Out-Null
    Invoke-Api -Method "POST" -Path "/proposals/$proposalId/submit" -Token $pengusulToken | Out-Null
    Invoke-Api -Method "POST" -Path "/proposals/$proposalId/verify" -Token $verifikatorToken -Body @{
        notes = "Verifikasi HTTP"
    } | Out-Null
    Invoke-Api -Method "POST" -Path "/proposals/$proposalId/final-approve" -Token $kepalaToken -Body @{
        notes = "Approve kepala HTTP sebelum komite"
    } | Out-Null

    Assert-DownloadOk -Token $komiteToken -AttachmentId $attachmentId -Label "$slug-komite"
    Assert-Forbidden -Token $otherKomiteToken -Path "/attachments/$attachmentId/download" -Label "$slug other komite attachment"
    $reject = Invoke-Api -Method "POST" -Path "/proposals/$proposalId/reject" -Token $komiteToken -Body @{
        rejection_reason = "Reject komite HTTP"
        improvement_suggestions = "Perbaikan dari komite pada flow HTTP."
    }
    if ($reject.data.status -ne "rejected") {
        throw "Komite reject failed for $name"
    }

    Invoke-Api -Method "PUT" -Path "/proposals/$proposalId" -Token $pengusulToken -Body @{
        description = "Perbaikan setelah reject komite"
    } | Out-Null
    Invoke-Api -Method "POST" -Path "/proposals/$proposalId/submit" -Token $pengusulToken | Out-Null
    Invoke-Api -Method "POST" -Path "/proposals/$proposalId/verify" -Token $verifikatorToken -Body @{
        notes = "Verifikasi HTTP ulang"
    } | Out-Null

    Assert-DownloadOk -Token $kepalaToken -AttachmentId $attachmentId -Label "$slug-kepala"
    $kepalaList = Invoke-Api -Method "GET" -Path "/proposals" -Token $kepalaToken
    $kepalaProposal = @($kepalaList.data | Where-Object { $_.id -eq $proposalId } | Select-Object -First 1)[0]
    if (-not $kepalaProposal.user.email -or -not $kepalaProposal.bidang_id) {
        throw "Kepala proposal detail missing creator or bidang for $name"
    }

    $reject = Invoke-Api -Method "POST" -Path "/proposals/$proposalId/reject" -Token $kepalaToken -Body @{
        rejection_reason = "Reject kepala HTTP"
        improvement_suggestions = "Perbaikan dari kepala madrasah pada flow HTTP."
    }
    if ($reject.data.status -ne "rejected") {
        throw "Kepala reject failed for $name"
    }

    Invoke-Api -Method "PUT" -Path "/proposals/$proposalId" -Token $pengusulToken -Body @{
        description = "Perbaikan setelah reject kepala"
    } | Out-Null
    Invoke-Api -Method "POST" -Path "/proposals/$proposalId/submit" -Token $pengusulToken | Out-Null
    Invoke-Api -Method "POST" -Path "/proposals/$proposalId/verify" -Token $verifikatorToken -Body @{
        notes = "Verifikasi final HTTP"
    } | Out-Null
    Invoke-Api -Method "POST" -Path "/proposals/$proposalId/final-approve" -Token $kepalaToken -Body @{
        notes = "Approve kepala final HTTP"
    } | Out-Null
    $final = Invoke-Api -Method "POST" -Path "/proposals/$proposalId/approve" -Token $komiteToken -Body @{
        notes = "Approve final komite HTTP"
    }
    if ($final.data.proposal.status -ne "final_approved") {
        throw "Komite final approve failed for $name"
    }

    $pending = Invoke-Api -Method "GET" -Path "/payments/pending" -Token $bendaharaToken
    if (-not (@($pending.data | Where-Object { $_.id -eq $proposalId }).Count -gt 0)) {
        throw "Bendahara pending list missing proposal for $name"
    }

    $paymentId = Process-Payment -Token $bendaharaToken -ProposalId $proposalId -Slug $slug
    Assert-Forbidden -Token $bendaharaToken -Path "/payments/$paymentId/reject" -Label "$slug bendahara reject" -Method "POST"
    Assert-Forbidden -Token $bendaharaToken -Path "/payments/$paymentId/cancel" -Label "$slug bendahara cancel" -Method "POST"
    $complete = Invoke-Api -Method "POST" -Path "/payments/$paymentId/complete" -Token $bendaharaToken -Body @{
        admin_notes = "Selesai HTTP"
    }
    if ($complete.data.payment_status -ne "completed" -or $complete.data.proposal_status -ne "completed") {
        throw "Payment complete failed for $name"
    }

    Write-Host "PASS $name proposal=$proposalId payment=$paymentId"
}

Write-Host "ALL LOCAL HTTP FLOW CHECKS PASSED"

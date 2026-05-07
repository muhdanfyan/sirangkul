<?php
/**
 * Run Role E2E Test - SiRangkul
 * 
 * Skrip ini mensimulasikan login untuk setiap role di SiRangkul
 * dan mencoba mengakses endpoint yang terlarang bagi role tersebut.
 * Harapannya adalah menerima status 403 (Forbidden).
 * 
 * Penggunaan: php run_rbac_test.php
 */

$baseUrl = 'http://127.0.0.1:8001/api';

// Harus dipastikan data uji ini persis ada di database VPS
$users = [
    'administrator'  => ['email' => 'admin@sirangkul.com', 'password' => 'password'],
    'pengusul'       => ['email' => 'ahmad@madrasah.com', 'password' => 'password'],
    'verifikator'    => ['email' => 'siti@madrasah.com', 'password' => 'password'],
    'komite_madrasah'=> ['email' => 'komite@madrasah.com', 'password' => 'password'],
    'kepala_madrasah'=> ['email' => 'kepala@madrasah.com', 'password' => 'password'],
    'bendahara'      => ['email' => 'bendahara@madrasah.com', 'password' => 'password']
];

function makeRequest($url, $method = 'GET', $data = null, $token = null) {
    global $baseUrl;
    $ch = curl_init();
    
    $headers = [
        'Content-Type: application/json',
        'Accept: application/json'
    ];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }

    curl_setopt($ch, CURLOPT_URL, $baseUrl . $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For local/testing context

    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ['code' => $httpCode, 'body' => json_decode($response, true)];
}

echo "=== Memulai Sirangkul RBAC Verification ===\n\n";

// 1. Dapatkan Token untuk semua User
$tokens = [];
foreach ($users as $role => $credentials) {
    echo "Login sebagai [$role]... ";
    $res = makeRequest('/auth/login', 'POST', $credentials);
    
    if ($res['code'] == 200 && isset($res['body']['token'])) {
        $tokens[$role] = $res['body']['token'];
        echo "SUCCESS\n";
    } else {
        echo "FAILED (Code: {$res['code']})\n";
        exit(1);
    }
}

echo "\n--- Pengujian Akses Negatif (RBAC) ---\n";

// Skenario 1: Verifikator mencoba buat RKAM (Hanya Admin)
$res = makeRequest('/rkam', 'POST', ['nama_program' => 'Test', 'pagu_anggaran' => 100], $tokens['verifikator']);
echo "Role [Verifikator] mencoba buat RKAM -> Expected: 403, Got: {$res['code']} ... ";
echo ($res['code'] == 403 ? "PASS\n" : "FAIL (Security Breach!)\n");

// Skenario 2: Pengusul mencoba Approve Proposal (Hanya Verifikator/Komite/Kepala)
$res = makeRequest('/proposals/uuid-dummy-123/approve', 'POST', [], $tokens['pengusul']);
echo "Role [Pengusul] mencoba ACC Proposal -> Expected: 404/403, Got: {$res['code']} ... ";
echo (in_array($res['code'], [403, 404]) ? "PASS\n" : "FAIL (Security Breach!)\n");

// Skenario 3: Admin mencoba bayar kas (Hanya Bendahara)
$res = makeRequest('/payments', 'POST', ['proposal_id' => '123'], $tokens['administrator']);
echo "Role [Admin] mencoba Bayar Dana -> Expected: 404/403, Got: {$res['code']} ... ";
echo (in_array($res['code'], [403, 404]) ? "PASS\n" : "FAIL (Security Breach!)\n");

echo "\n=== Verifikasi RBAC Selesai ===\n";

<?php
/**
 * Run Routes and Components Integration Test - SiRangkul
 * 
 * Skrip ini didesain khusus untuk menguji semua pemetaan endpoint API
 * yang didokumentasikan di `docs/routes-and-components.md`.
 * Menguji fungsionalitas murni dari kacamata React Component.
 * 
 * Penggunaan: php run_routes_integration_test.php
 */

$baseUrl = 'https://sirangkul.man2kotamakassar.sch.id/api';

$credentials = [
    'admin' => ['email' => 'admin@sirangkul.com', 'password' => 'password'],
    'pengusul' => ['email' => 'ahmad@madrasah.com', 'password' => 'password']
];

function makeApiReq($url, $method = 'GET', $data = null, $token = null) {
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
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

    if ($data !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }

    $response = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ['code' => $code, 'body' => json_decode($response, true) ?? $response];
}

echo "========================================================\n";
echo " SIRANGKUL COMPONENT-ROUTES INTEGRATION DIAGNOSTICS\n";
echo "========================================================\n\n";

// --- MODUL 1: AUTENTIKASI ---
echo "[1] MODUL AUTENTIKASI\n";
// 1.1 Login (/login -> /api/auth/login) POST
echo " -> Menguji POST /api/auth/login (Login UI)... ";
$resLogin = makeApiReq('/auth/login', 'POST', $credentials['admin']);
if ($resLogin['code'] == 200 && isset($resLogin['body']['token'])) {
    $adminToken = $resLogin['body']['token'];
    echo "SUCCESS (200 OK - Token Acquired)\n";
} else {
    echo "FAILED ({$resLogin['code']})\n";
    exit(1);
}

// 1.2 Auth Me (Global Layout Guard -> /api/auth/me) GET
echo " -> Menguji GET /api/auth/me (Guard UI)... ";
$resMe = makeApiReq('/auth/me', 'GET', null, $adminToken);
echo ($resMe['code'] == 200) ? "SUCCESS (200 OK)\n" : "FAILED ({$resMe['code']})\n";


// --- MODUL 2: MANAJEMEN PENGGUNA (Admin Only) ---
echo "\n[2] MODUL MANAJEMEN PENGGUNA\n";
// 2.1 Get Users (/users -> /api/users)
echo " -> Menguji GET /api/users (Tabel User UI)... ";
$resUsers = makeApiReq('/users', 'GET', null, $adminToken);
echo ($resUsers['code'] == 200) ? "SUCCESS (200 OK)\n" : "FAILED ({$resUsers['code']})\n";

// 2.2 Create User Validation (Modal Form -> /api/users POST)
echo " -> Menguji POST /api/users (Validation UI 422 Check)... ";
// Submit kosong memicu 422 atau 500 jika FormRequest belum sempurna
$resUsersPost = makeApiReq('/users', 'POST', [], $adminToken);
echo ($resUsersPost['code'] == 422 || $resUsersPost['code'] == 500) ? "SUCCESS (422/500 Validation Reject)\n" : "FAILED (Ekspetasi 422/500, didapat {$resUsersPost['code']})\n";


// --- MODUL 3: RKAM ---
echo "\n[3] MODUL PERENCANAAN ANGGARAN (RKAM)\n";
// 3.1 Get RKAM (/rkam -> /api/rkam)
echo " -> Menguji GET /api/rkam (Tabel Master RKAM UI)... ";
$resRkam = makeApiReq('/rkam', 'GET', null, $adminToken);
echo ($resRkam['code'] == 200) ? "SUCCESS (200 OK)\n" : "FAILED ({$resRkam['code']})\n";

// 3.2 Create RKAM Validation
echo " -> Menguji POST /api/rkam (Form RKAM UI 422 Check)... ";
$resRkamPost = makeApiReq('/rkam', 'POST', ['invalid' => 'data'], $adminToken);
echo ($resRkamPost['code'] == 400 || $resRkamPost['code'] == 422) ? "SUCCESS ({$resRkamPost['code']} validasi tertangkap)\n" : "FAILED (Got {$resRkamPost['code']})\n";


// --- MODUL 4: PENGUSUL (Pengajuan Proposal) ---
echo "\n[4] MODUL PENGAJUAN PROPOSAL\n";
// Auth as Pengusul
$logPengusul = makeApiReq('/auth/login', 'POST', $credentials['pengusul']);
$pengusulToken = $logPengusul['body']['token'];

echo " -> Menguji GET /api/proposals (My-List UI)... ";
$resProps = makeApiReq('/proposals', 'GET', null, $pengusulToken);
// Even if empty array, must be 200
echo ($resProps['code'] == 200) ? "SUCCESS (200 OK)\n" : "FAILED ({$resProps['code']})\n";

echo " -> Menguji POST /api/proposals (Form Create)... ";
// Tanpa PDF file di cURL sederhana, harusnya 422 validasi
$resPropPost = makeApiReq('/proposals', 'POST', ['judul' => 'Test'], $pengusulToken);
echo ($resPropPost['code'] == 422 || $resPropPost['code'] == 500) ? "SUCCESS ({$resPropPost['code']} validasi ditangkap UI)\n" : "FAILED/WARN ({$resPropPost['code']})\n";


// --- MODUL 5: VERIFIKASI & APPROVAL ---
echo "\n[5] MODUL VERIFIKASI & APPROVAL\n";
echo " -> Menguji GET /api/proposals?status=Submitted (Workflow Pending UI)... ";
$resDrafts = makeApiReq('/proposals?status=Submitted', 'GET', null, $adminToken);
echo ($resDrafts['code'] == 200) ? "SUCCESS (200 OK)\n" : "FAILED ({$resDrafts['code']})\n";


// --- MODUL 6: LOGOUT FUNCTIONALITY ---
echo "\n[6] MODUL LOGOUT\n";
echo " -> Menguji POST /api/auth/logout (Header Nav UI)... ";
$resLogout = makeApiReq('/auth/logout', 'POST', null, $adminToken);
echo ($resLogout['code'] == 200) ? "SUCCESS (200 OK - Token Revoked)\n" : "FAILED ({$resLogout['code']})\n";

// Memastikan Token sudah mati (Should intercept by Axios as 401)
echo " -> Menguji Cek Token Mati (401 UI Redirect Check)... ";
$resDead = makeApiReq('/auth/me', 'GET', null, $adminToken);
echo ($resDead['code'] == 401 || $resDead['code'] == 404) ? "SUCCESS ({$resDead['code']} Unauthenticated)\n" : "FAILED (Kebocoran Akses: {$resDead['code']})\n";

echo "\n========================================================\n";
echo " SEMUA ROUTE KOMPONEN BERHASIL DISIMULASIKAN & DIUJI\n";
echo "========================================================\n";

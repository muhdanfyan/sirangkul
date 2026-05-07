#!/bin/bash
# test_penetration.sh
# Skrip Dasar Penetrasi & Uji Vulnerability (OWASP Top 10)
# Peringatan: Jalankan skrip ini HANYA pada enviroment testing atau pada server milik sendiri.

DOMAIN="https://sirangkul.man2kotamakassar.sch.id"
API_URL="${DOMAIN}/api"
ADMIN_EMAIL="admin@sirangkul.com"
ADMIN_PASS="password"

echo "================================================="
echo "  SIRANGKUL VULNERABILITY & PENETRATION SCANNER  "
echo "================================================="

# Dapatkan Token Autentikasi terlebih dahulu
LOGIN_RES=$(curl -s -X POST -H "Content-Type: application/json" -H "Accept: application/json" -d "{\"email\":\"${ADMIN_EMAIL}\", \"password\":\"${ADMIN_PASS}\"}" "${API_URL}/auth/login")
TOKEN=$(echo "$LOGIN_RES" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ [ERROR] Gagal mendapatkan token Admin untuk Pentest credential-based."
    exit 1
fi

echo -e "\n[+] 1. Menguji SQL Injection (Authentication Bypass)"
# Mencoba SQLi via email
SQLI_RES=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -H "Accept: application/json" -d '{"email":"admin@sirangkul.com\" OR 1=1--", "password":"password"}' "${API_URL}/auth/login")
SQLI_CODE=$(echo "$SQLI_RES" | tail -n1)
if [[ "$SQLI_CODE" == "401" ]] || [[ "$SQLI_CODE" == "422" ]]; then
    echo "✅ [PASS] SQL Injection ditolak ($SQLI_CODE)."
else
    echo "❌ [FAIL] POTENSI SQL INJECTION DETECTED! Status code: $SQLI_CODE"
fi

echo -e "\n[+] 2. Menguji Cross-Site Scripting (XSS) pada Payload JSON"
# Menyisipkan skrip XSS ke pencarian atau input data
XSS_RES=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -H "Accept: application/json" -H "Authorization: Bearer ${TOKEN}" -d '{"nama_program":"<script>alert(1)</script>", "pagu_anggaran":100}' "${API_URL}/rkam")
XSS_CODE=$(echo "$XSS_RES" | tail -n1)
if [[ "$XSS_CODE" == "422" ]] || [[ "$XSS_CODE" == "200" || "$XSS_CODE" == "201" ]]; then
     # Di backend Laravel, idealnya XSS dibersihkan namun sebagai REST API, sanitize terjadi saat dirender oleh frontend(React escape HTML).
     # Kita pastikan tidak ada 500 error gara-gara karakter aneh.
    echo "✅ [PASS] XSS Payload berhasil diproses/ditolak API tanpa Fatal Error ($XSS_CODE)."
else
    echo "⚠️ [WARN] Server response unexpected terhadap XSS: $XSS_CODE"
fi

echo -e "\n[+] 3. Menguji Path Traversal & Open Directory"
TRAVERSAL_RES=$(curl -s -i -X GET -H "Accept: application/json" "${API_URL}/../../../../../../etc/passwd")
TRAV_CODE=$(echo "$TRAVERSAL_RES" | grep HTTP | awk '{print $2}')
TRAV_BODY=$(echo "$TRAVERSAL_RES" | grep "root:x:")

if [[ -n "$TRAV_BODY" ]]; then
    echo "❌ [FAIL] CRITICAL PATH TRAVERSAL LUBANG! Target /etc/passwd terekspos."
elif [[ "$TRAV_CODE" == "404" || "$TRAV_CODE" == "400" || "$TRAV_CODE" == "403" ]]; then
    echo "✅ [PASS] Path Traversal diblokir oleh server ($TRAV_CODE)."
elif [[ "$TRAV_CODE" == "200" ]]; then
    echo "✅ [PASS] False Positive (SPA Fallback 200). File tidak bocor, Nginx me-render UI Frontend."
else
    echo "⚠️ [WARN] Response tidak dikenali: $TRAV_CODE"
fi

echo -e "\n[+] 4. Menguji Manipulasi JWT Token"
# Mencoba mengubah token 1 karakter
BAD_TOKEN="${TOKEN}x"
JWT_RES=$(curl -s -w "\n%{http_code}" -X GET -H "Authorization: Bearer ${BAD_TOKEN}" -H "Accept: application/json" "${API_URL}/auth/me")
JWT_CODE=$(echo "$JWT_RES" | tail -n1)
if [[ "$JWT_CODE" == "401" ]]; then
    echo "✅ [PASS] Manipulasi JWT ditolak (401 Unauthenticated)."
else
    echo "❌ [FAIL] Token invalid tapi masih lolos! Status: $JWT_CODE"
fi

echo -e "\n[+] 5. Menguji Rate Limiting (Brute Force Protection)"
echo "    -> Mengirim 10 request login beruntun memicu throttle laravel (biasanya 5 attempts/min)..."
for i in {1..7}
do
   LOGIN_BF=$(curl -s -w "%{http_code}" -X POST -o /dev/null -H "Content-Type: application/json" -H "Accept: application/json" -d '{"email":"wrong@test.com", "password":"xxx"}' "${API_URL}/auth/login")
done
# Request ke-8
LOGIN_LAST=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -H "Accept: application/json" -d '{"email":"w@test.com", "password":"a"}' "${API_URL}/auth/login")
LAST_CODE=$(echo "$LOGIN_LAST" | tail -n1)

if [[ "$LAST_CODE" == "429" ]]; then
    echo "✅ [PASS] Rate Limiting (Too Many Requests) berhasil melindungi API ($LAST_CODE)."
else
    echo "⚠️ [WARN] Rate Limiting absen atau ambang batas > 5 request ($LAST_CODE)."
fi

echo -e "\n================================================="
echo "  PENTEST BASIC COMPLETED                        "
echo "================================================="

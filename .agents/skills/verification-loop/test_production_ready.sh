#!/bin/bash
# test_production_ready.sh
# Skrip Pengecekan Kesiapan Mode Produksi (Safety Gates Check)
# Untuk SiRangkul

echo "##################################"
echo "  SIRANGKUL PROD SAFETY GATE TEST "
echo "##################################"
echo ""

DOMAIN="sirangkul.man2kotamakassar.sch.id"

# 1. HSTS & HTTPS Gate
echo ">> Checking HSTS & HTTPS Status..."
HEADER_CHECK=$(curl -sI "https://${DOMAIN}/" | grep -i "Strict-Transport-Security")
if [[ -z "$HEADER_CHECK" ]]; then
   echo "   [FAIL] Missing HSTS Header di Nginx! Potensi downgrade attack."
else
   echo "   [PASS] Memiliki HSTS Proteksi (HTTPS Valid)."
fi

# 2. Open Directory Index Risk
echo ">> Checking Nginx API Public Open Directory..."
DIR_CHECK=$(curl -s -w "\n%{http_code}" -X GET -H "Accept: application/json" "https://${DOMAIN}/api/")
HTTP_CODE=$(echo "$DIR_CHECK" | tail -n1)
if [[ "$HTTP_CODE" == "404" ]] || [[ "$HTTP_CODE" == "403" ]]; then
   echo "   [PASS] Akses eksplorasi direktori dilarang atau not found (Secure)."
else
   echo "   [WARN] Status code tidak spesifik 404/403: $HTTP_CODE . Pastikan directory index files tertutup."
fi

# 3. Environment Leak Risk
echo ">> Checking .env Leak Exposure..."
ENV_LEAK=$(curl -s -w "\n%{http_code}" -X GET "https://${DOMAIN}/api/.env")
ENV_HTTP_CODE=$(echo "$ENV_LEAK" | tail -n1)
if [[ "$ENV_HTTP_CODE" == "404" ]] || [[ "$ENV_HTTP_CODE" == "403" ]]; then
   echo "   [PASS] File .env API tidak terekspos ke publik ($ENV_HTTP_CODE)."
else
   echo "   [FAIL] FILE .ENV. SIAGA 1 ($ENV_HTTP_CODE)!"
fi

echo ""
echo ">> Pengecekan Tuntas."

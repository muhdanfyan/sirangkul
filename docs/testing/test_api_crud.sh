#!/bin/bash
# test_api_crud.sh
# Skrip untuk menguji CRUD dasar API Sirangkul (Sanity Check)

DOMAIN="https://sirangkul.man2kotamakassar.sch.id"
API_URL="${DOMAIN}/api"
ADMIN_EMAIL="admin@sirangkul.com"
ADMIN_PASS="password"

echo "================================================"
echo "    Sirangkul API CRUD Diagnostics              "
echo "================================================"

# 1. Health Check
echo ""
echo "[1/4] Checking API Health..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET -H "Accept: application/json" "${API_URL}/health")
HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ Health Check OK: $BODY"
else
    echo "❌ Health Check FAILED (Status: $HTTP_STATUS)"
    exit 1
fi

# 2. Login Check (Tanpa status Cookie - Pure Bearer)
echo ""
echo "[2/4] Testing Admin Login (Stateless)..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST -H "Accept: application/json" -H "Content-Type: application/json" -d "{\"email\":\"${ADMIN_EMAIL}\", \"password\":\"${ADMIN_PASS}\"}" "${API_URL}/auth/login")
HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 201 ]; then
    TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    if [ -n "$TOKEN" ]; then
        echo "✅ Login OK. Token Acquired."
    else
         echo "❌ Login OK but Token is missing from JSON response!"
         exit 1
    fi
else
    echo "❌ Login FAILED (Status: $HTTP_STATUS) - Response: $BODY"
    exit 1
fi

# 3. Read Data (Get RKAM list)
echo ""
echo "[3/4] Fetching RKAM List..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET -H "Accept: application/json" -H "Authorization: Bearer ${TOKEN}" "${API_URL}/rkam")
HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ Fetch RKAM OK."
elif [ "$HTTP_STATUS" -eq 403 ]; then
    echo "❌ Fetch RKAM FAILED - 403 Forbidden (RBAC Error!)"
    exit 1
else
    echo "❌ Fetch RKAM FAILED (Status: $HTTP_STATUS)"
    exit 1
fi

# 4. Auth Me Check
echo ""
echo "[4/4] Verifying Bearer Token (/auth/me)..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET -H "Accept: application/json" -H "Authorization: Bearer ${TOKEN}" "${API_URL}/auth/me")
HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ /auth/me OK - Token is fully active."
else
    echo "❌ /auth/me FAILED (Status: $HTTP_STATUS)"
    exit 1
fi

echo ""
echo "================================================"
echo "    Semua Tes Diagnostik Dasar BERHASIL!        "
echo "================================================"
exit 0

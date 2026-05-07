#!/bin/bash
# run_all_tests.sh
# Master Runner untuk mengeksekusi semua testing SiRangkul secara berurutan
# Output akan di-log secara otomatis ke folder /results

mkdir -p /Users/pondokit/Herd/sirangkul/docs/testing/results
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOGFILE="/Users/pondokit/Herd/sirangkul/docs/testing/results/test_run_${TIMESTAMP}.log"

echo "=================================================" | tee -a "$LOGFILE"
echo "  MEMULAI SIRANGKUL MASTER TESTING SUITE         " | tee -a "$LOGFILE"
echo "  Waktu: $(date)" | tee -a "$LOGFILE"
echo "=================================================" | tee -a "$LOGFILE"

echo -e "\n[+] 1/4 Menjalankan Safety Gate Production..." | tee -a "$LOGFILE"
/Users/pondokit/Herd/sirangkul/docs/testing/test_production_ready.sh 2>&1 | tee -a "$LOGFILE"

echo -e "\n[+] 2/4 Menjalankan API CRUD Diagnostics..." | tee -a "$LOGFILE"
/Users/pondokit/Herd/sirangkul/docs/testing/test_api_crud.sh 2>&1 | tee -a "$LOGFILE"

echo -e "\n[+] 3/4 Menjalankan Otomasi RBAC Control..." | tee -a "$LOGFILE"
php /Users/pondokit/Herd/sirangkul/docs/testing/run_rbac_test.php 2>&1 | tee -a "$LOGFILE"

echo -e "\n[+] 4/5 Menjalankan Simulator Alur UI E2E..." | tee -a "$LOGFILE"
php /Users/pondokit/Herd/sirangkul/docs/testing/run_role_e2e_test.php 2>&1 | tee -a "$LOGFILE"

echo -e "\n[+] 5/6 Menjalankan Route & Component Integration Simulator..." | tee -a "$LOGFILE"
php /Users/pondokit/Herd/sirangkul/docs/testing/run_routes_integration_test.php 2>&1 | tee -a "$LOGFILE"

echo -e "\n[+] 6/6 Menjalankan Vulnerability & Penetration Scanner (OWASP Top 10)..." | tee -a "$LOGFILE"
/Users/pondokit/Herd/sirangkul/docs/testing/test_penetration.sh 2>&1 | tee -a "$LOGFILE"

echo -e "\n=================================================" | tee -a "$LOGFILE"
echo "  SIMULASI PENGUJIAN SELESAI                     " | tee -a "$LOGFILE"
echo "  Log detil direkam ke: $LOGFILE" | tee -a "$LOGFILE"
echo "=================================================" | tee -a "$LOGFILE"

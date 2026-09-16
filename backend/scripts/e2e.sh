#!/bin/bash
# End-to-end verification of the whole loan lifecycle against a running API.
# Usage: npm run test:e2e   (starts and stops its own server; seeds the database)
# End-to-end verification of the full loan lifecycle against the real API.
cd "$(dirname "$0")/.." || exit 1
S=$(mktemp -d)
trap 'rm -rf "$S"' EXIT
API=http://127.0.0.1:5001/api
pass=0; fail=0

j() { node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const o=JSON.parse(s);const root=o.data??o;const v=process.argv[1].split('.').reduce((a,k)=>a?.[k],root);console.log(typeof v==='object'?JSON.stringify(v):v)}catch(e){console.log('PARSE_ERR')}})" "$1"; }
check() { # name expected actual
  if [ "$2" == "$3" ]; then echo "  PASS  $1"; pass=$((pass+1));
  else echo "  FAIL  $1 — expected [$2] got [$3]"; fail=$((fail+1)); fi
}

echo "### 1. Seeding"
npm run seed --silent 2>&1 | tail -8 || exit 1

echo "### 2. Starting server"
npm run dev --silent > "$S/server.log" 2>&1 &
SRV=$!
for i in $(seq 1 40); do
  curl -sf http://127.0.0.1:5001/health >/dev/null 2>&1 && break
  sleep 0.5
done
if ! curl -sf http://127.0.0.1:5001/health >/dev/null; then
  echo "SERVER FAILED TO START:"; cat "$S/server.log"; kill $SRV 2>/dev/null; exit 1
fi
echo "  server up"

BORROWER="e2e$(date +%s)@test.com"

echo "### 3. Auth + RBAC"
code=$(curl -s -o /dev/null -w '%{http_code}' $API/sanction/loans)
check "no cookie -> 401" 401 "$code"

curl -s -c $S/borrower.jar -X POST $API/auth/signup -H 'Content-Type: application/json' \
  -d "{\"name\":\"E2E Borrower\",\"email\":\"$BORROWER\",\"password\":\"Passw0rd1\"}" > $S/signup.json
check "signup role is borrower" borrower "$(j user.role < $S/signup.json)"

code=$(curl -s -o /dev/null -w '%{http_code}' -b $S/borrower.jar $API/sanction/loans)
check "borrower on sanction queue -> 403" 403 "$code"

# A client trying to promote itself must be ignored, not obeyed.
curl -s -X POST $API/auth/signup -H 'Content-Type: application/json' \
  -d "{\"name\":\"Sneaky\",\"email\":\"sneaky$(date +%s)@test.com\",\"password\":\"Passw0rd1\",\"role\":\"admin\"}" > $S/sneaky.json
check "role in signup body ignored" borrower "$(j user.role < $S/sneaky.json)"

echo "### 4. BRE rejection (all four rules fail at once)"
curl -s -b $S/borrower.jar -X PUT $API/applications/me/personal-details -H 'Content-Type: application/json' \
  -d '{"fullName":"Bad Applicant","pan":"BADPAN123","dob":"1960-01-01","monthlySalary":10000,"employmentMode":"unemployed"}' > $S/bre_fail.json
check "BRE reject code" BRE_REJECTED "$(j error.code < $S/bre_fail.json)"
check "all 4 rules reported" 4 "$(node -e "const d=require('$S/bre_fail.json');console.log(d.error.details.failures.length)")"

echo "### 5. BRE pass"
curl -s -b $S/borrower.jar -X PUT $API/applications/me/personal-details -H 'Content-Type: application/json' \
  -d '{"fullName":"Good Applicant","pan":"ABCDE1234F","dob":"1995-06-15","monthlySalary":60000,"employmentMode":"salaried"}' > $S/bre_pass.json
check "BRE passed" passed "$(j application.breStatus < $S/bre_pass.json)"

echo "### 6. Step gating — apply before uploading slip"
code=$(curl -s -o /dev/null -w '%{http_code}' -b $S/borrower.jar -X POST $API/loans -H 'Content-Type: application/json' -d '{"principal":100000,"tenureDays":90}')
check "apply without slip -> 409" 409 "$code"

echo "### 7. Salary slip upload"
printf '%%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%%%EOF\n' > $S/slip.pdf
curl -s -b $S/borrower.jar -X POST $API/applications/me/salary-slip -F "salarySlip=@$S/slip.pdf" > $S/upload.json
check "slip uploaded" slip_uploaded "$(j application.step < $S/upload.json)"

echo "  rejecting a disallowed file type:"
printf 'not a real document' > $S/bad.txt
code=$(curl -s -o /dev/null -w '%{http_code}' -b $S/borrower.jar -X POST $API/applications/me/salary-slip -F "salarySlip=@$S/bad.txt")
check ".txt upload -> 400" 400 "$code"

echo "### 8. Apply — server-side loan maths"
curl -s -b $S/borrower.jar -X POST $API/loans -H 'Content-Type: application/json' \
  -d '{"principal":100000,"tenureDays":90}' > $S/loan.json
LOAN=$(j loan.id < $S/loan.json)
check "status APPLIED" APPLIED "$(j loan.status < $S/loan.json)"
check "SI = 100000*12*90/36500" 2958.9 "$(j loan.simpleInterest < $S/loan.json)"
check "total repayment" 102958.9 "$(j loan.totalRepayment < $S/loan.json)"

code=$(curl -s -o /dev/null -w '%{http_code}' -b $S/borrower.jar -X POST $API/loans -H 'Content-Type: application/json' -d '{"principal":200000,"tenureDays":60}')
check "second active loan -> 409" 409 "$code"
code=$(curl -s -o /dev/null -w '%{http_code}' -b $S/borrower.jar -X POST $API/loans -H 'Content-Type: application/json' -d '{"principal":10000,"tenureDays":90}')
check "principal below floor -> 400" 400 "$code"

echo "### 9. Sanction"
curl -s -c $S/sanction.jar -X POST $API/auth/login -H 'Content-Type: application/json' -d '{"email":"sanction@lms.test","password":"Sanction@123"}' > /dev/null
code=$(curl -s -o /dev/null -w '%{http_code}' -b $S/sanction.jar -X PATCH $API/disbursement/loans/$LOAN/disburse)
check "sanction role on disbursement route -> 403" 403 "$code"
curl -s -b $S/sanction.jar -X PATCH $API/sanction/loans/$LOAN -H 'Content-Type: application/json' -d '{"action":"approve"}' > $S/sanction.json
check "status SANCTIONED" SANCTIONED "$(j loan.status < $S/sanction.json)"
code=$(curl -s -o /dev/null -w '%{http_code}' -b $S/sanction.jar -X PATCH $API/sanction/loans/$LOAN -H 'Content-Type: application/json' -d '{"action":"approve"}')
check "re-approving -> 409" 409 "$code"

echo "### 10. Disbursement"
curl -s -c $S/disb.jar -X POST $API/auth/login -H 'Content-Type: application/json' -d '{"email":"disbursement@lms.test","password":"Disburse@123"}' > /dev/null
curl -s -b $S/disb.jar -X PATCH $API/disbursement/loans/$LOAN/disburse > $S/disb.json
check "status DISBURSED" DISBURSED "$(j loan.status < $S/disb.json)"

echo "### 11. Collection + auto-close"
curl -s -c $S/coll.jar -X POST $API/auth/login -H 'Content-Type: application/json' -d '{"email":"collection@lms.test","password":"Collect@123"}' > /dev/null
UTR="UTR$(date +%s)"
curl -s -b $S/coll.jar -X POST $API/collection/loans/$LOAN/payments -H 'Content-Type: application/json' \
  -d "{\"utrNumber\":\"$UTR\",\"amount\":50000,\"paymentDate\":\"$(date -u +%Y-%m-%d)\"}" > $S/pay1.json
check "partial payment outstanding" 52958.9 "$(j loan.outstandingAmount < $S/pay1.json)"
check "still DISBURSED" DISBURSED "$(j loan.status < $S/pay1.json)"

code=$(curl -s -o /dev/null -w '%{http_code}' -b $S/coll.jar -X POST $API/collection/loans/$LOAN/payments -H 'Content-Type: application/json' \
  -d "{\"utrNumber\":\"$UTR\",\"amount\":100,\"paymentDate\":\"$(date -u +%Y-%m-%d)\"}")
check "duplicate UTR -> 409" 409 "$code"

curl -s -b $S/coll.jar -X POST $API/collection/loans/$LOAN/payments -H 'Content-Type: application/json' \
  -d "{\"utrNumber\":\"${UTR}X\",\"amount\":999999,\"paymentDate\":\"$(date -u +%Y-%m-%d)\"}" > $S/over.json
check "overpayment rejected" OVERPAYMENT "$(j error.code < $S/over.json)"

curl -s -b $S/coll.jar -X POST $API/collection/loans/$LOAN/payments -H 'Content-Type: application/json' \
  -d "{\"utrNumber\":\"${UTR}F\",\"amount\":52958.90,\"paymentDate\":\"$(date -u +%Y-%m-%d)\"}" > $S/pay2.json
check "auto-closed on final payment" CLOSED "$(j loan.status < $S/pay2.json)"
check "outstanding is zero" 0 "$(j loan.outstandingAmount < $S/pay2.json)"

code=$(curl -s -o /dev/null -w '%{http_code}' -b $S/coll.jar -X POST $API/collection/loans/$LOAN/payments -H 'Content-Type: application/json' \
  -d "{\"utrNumber\":\"${UTR}Z\",\"amount\":100,\"paymentDate\":\"$(date -u +%Y-%m-%d)\"}")
check "payment on closed loan -> 409" 409 "$code"

echo "### 12. Admin reaches every module"
curl -s -c $S/admin.jar -X POST $API/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@lms.test","password":"Admin@123"}' > /dev/null
for m in sales/leads sanction/loans disbursement/loans collection/loans; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -b $S/admin.jar $API/$m)
  check "admin -> /$m" 200 "$code"
done
code=$(curl -s -o /dev/null -w '%{http_code}' -b $S/admin.jar $API/applications/me)
check "admin blocked from borrower portal -> 403" 403 "$code"

kill $SRV 2>/dev/null
echo
echo "================ $pass passed, $fail failed ================"
[ "$fail" -eq 0 ] || tail -20 "$S/server.log"

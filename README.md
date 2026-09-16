# Loan Management System

A lending platform with two halves: a **borrower portal** (multi-step application ending in a loan request) and an **operations dashboard** (four internal modules guarded by role-based access).

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Node.js · Express 5 · MongoDB · Mongoose · JWT · bcrypt

---

## Quick start

### Prerequisites
- Node.js 20+
- A MongoDB connection string (MongoDB Atlas works out of the box)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env     # then fill in MONGODB_URI and JWT_SECRET
npm run seed             # creates one account per role
npm run dev              # http://localhost:5001
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev              # http://localhost:3000
```

Open http://localhost:3000 and sign in with any account below.

> **Why port 5001?** On macOS, port 5000 is held by the AirPlay Receiver (ControlCenter), which
> silently answers requests with a 403. The backend uses 5001 to avoid it. Change `PORT` in
> `backend/.env` and `NEXT_PUBLIC_API_URL` in `frontend/.env.local` together if you prefer another port.

---

## Login credentials

Created by `npm run seed` (safe to re-run — it upserts rather than duplicating).

| Role | Email | Password | Can access |
|---|---|---|---|
| Admin | admin@lms.test | `Admin@123` | All four dashboard modules |
| Sales | sales@lms.test | `Sales@123` | Sales module only |
| Sanction | sanction@lms.test | `Sanction@123` | Sanction module only |
| Disbursement | disbursement@lms.test | `Disburse@123` | Disbursement module only |
| Collection | collection@lms.test | `Collect@123` | Collection module only |
| Borrower | borrower@lms.test | `Borrower@123` | Borrower portal only |

New sign-ups are **always** borrowers — see [Security decisions](#security-decisions).

---

## The borrower journey

1. **Sign up / log in** — password hashed with bcrypt, JWT returned in an httpOnly cookie.
2. **Personal details** — name, PAN, date of birth, monthly salary, employment mode. The **BRE** runs on submit.
3. **Salary slip** — PDF/JPG/PNG, max 5 MB.
4. **Loan configuration** — amount (₹50K–₹5L) and tenure (30–365 days) on sliders, with a live repayment panel. Applying creates a loan with status `APPLIED`.

The stepper resumes from wherever the server says the borrower actually got to, so a refresh never loses progress.

---

## Data model

```
User 1───1 Application        (the multi-step form edits one document)
User 1───N Loan               (at most one active at a time)
Loan 1───N Payment
```

### `users`
`name`, `email` (unique), `passwordHash` (never selected by default), `role`, timestamps

### `applications`
`userId` (unique), `fullName`, `pan`, `dob`, `monthlySalary`, `employmentMode`,
`breStatus` (`pending|passed|rejected`), `breFailures[]`, `salarySlip{path,originalName,mimeType,size,uploadedAt}`,
`step` (`registered|details_submitted|bre_passed|slip_uploaded|applied`)

### `loans`
`userId`, `applicationId`, `principal`, `tenureDays`, `interestRate`, `simpleInterest`, `totalRepayment`,
`amountPaid`, `status`, `rejectionReason`, audit fields (`sanctionedBy/At`, `rejectedBy/At`, `disbursedBy/At`, `closedAt`)

### `payments`
`loanId`, `utrNumber` (**unique index across all payments**), `amount`, `paymentDate`, `recordedBy`

---

## Loan status transitions

```
APPLIED ──approve──▶ SANCTIONED ──disburse──▶ DISBURSED ──auto──▶ CLOSED
   └─────reject─────▶ REJECTED
```

| From | To | Who |
|---|---|---|
| APPLIED | SANCTIONED | sanction, admin |
| APPLIED | REJECTED (reason required) | sanction, admin |
| SANCTIONED | DISBURSED | disbursement, admin |
| DISBURSED | CLOSED | **nobody** — the system closes the loan when `amountPaid == totalRepayment` |

`REJECTED` and `CLOSED` are terminal. After a rejection or closure the borrower may apply again.

The whole table lives in `backend/src/services/loan-status.service.ts`, so the rules are in one place rather than scattered across controllers.

---

## Business Rule Engine

| Rule | Rejection condition |
|---|---|
| Age | Not between 23 and 50 (inclusive), computed in exact completed years |
| Salary | Below ₹25,000/month |
| PAN | Fails `^[A-Z]{5}[0-9]{4}[A-Z]$` |
| Employment | Applicant is unemployed |

All four rules run on every submission and **every** failure is returned together, so the borrower fixes everything in one pass instead of discovering problems one at a time. A rejection is `422 BRE_REJECTED` — the request was well-formed, the applicant simply is not eligible.

---

## Loan maths

```
SI = (P × R × T) ÷ (365 × 100)      R = 12, T = tenure in days
Total repayment = P + SI
```

Rounded to 2 decimals in one helper (`utils/money.ts`). Comparisons happen in paise so floating-point error can never leave a loan a fraction of a rupee short of closing.

Worked example: ₹100,000 over 90 days → SI = ₹2,958.90 → total = ₹102,958.90.

---

## API

Success: `{ "success": true, "data": {...} }` · Error: `{ "success": false, "error": { "code", "message", "details?" } }`

Codes used: `400` invalid input · `401` not authenticated · `403` wrong role · `404` not found · `409` conflict · `422` rule rejection.

### Auth
| Method | Route | Access |
|---|---|---|
| POST | `/api/auth/signup` | public (always creates a borrower) |
| POST | `/api/auth/login` | public |
| POST | `/api/auth/logout` | public |
| GET | `/api/auth/me` | authenticated |

### Borrower portal
| Method | Route | Access |
|---|---|---|
| GET | `/api/applications/me` | borrower |
| PUT | `/api/applications/me/personal-details` | borrower (runs the BRE) |
| POST | `/api/applications/me/salary-slip` | borrower (multipart) |
| POST | `/api/loans/quote` | borrower (preview, stores nothing) |
| POST | `/api/loans` | borrower (apply) |
| GET | `/api/loans/me` | borrower |
| GET | `/api/loans/:id` | owner or staff |

### Dashboard
| Method | Route | Access |
|---|---|---|
| GET | `/api/sales/leads` | sales, admin |
| GET | `/api/sanction/loans` | sanction, admin |
| GET | `/api/sanction/loans/:id/salary-slip` | sanction, admin |
| PATCH | `/api/sanction/loans/:id` | sanction, admin |
| GET | `/api/disbursement/loans` | disbursement, admin |
| PATCH | `/api/disbursement/loans/:id/disburse` | disbursement, admin |
| GET | `/api/collection/loans` | collection, admin |
| GET | `/api/collection/loans/:id/payments` | collection, admin |
| POST | `/api/collection/loans/:id/payments` | collection, admin |

---

## Design decisions

### Should the BRE live on the client, the server, or both? — Both, with one of them authoritative.
The server is the **only** decision that counts: a user can disable JavaScript, edit the bundle, or call the API directly with curl, so anything enforced only in the browser is advisory. The client runs a copy of the same rules purely so the borrower sees "you must be 23–50" as they type instead of after a round trip. The rules are duplicated deliberately (`backend/src/services/bre.service.ts` and `frontend/lib/bre.ts`), and the server's answer always wins.

### Validation does not duplicate the business rules
The request validator checks *shape* (is this a string, is the date real). It deliberately does **not** check the PAN format or the salary floor, because a malformed PAN must come back as a BRE rejection the borrower can act on, not as a generic `400 Some fields are invalid`.

### JWT in an httpOnly cookie, not localStorage
`localStorage` is readable by any script on the page, so one XSS bug leaks the token. It is also invisible to Next.js middleware, which runs on the server — route guarding would have been impossible. The cookie is `httpOnly`, `sameSite`, and `secure` in production, and the frontend never touches the token.

### Overpayments are rejected, not capped
Silently reducing a ₹60,000 payment to the ₹52,958.90 outstanding would store a figure that no longer matches the amount the UTR actually represents, which makes reconciliation impossible. The API returns `422 OVERPAYMENT` with the real outstanding balance.

### One stored balance figure
Only `amountPaid` is stored; `outstandingAmount` is derived from it. Storing both invites the two to drift apart after a failed write.

### Concurrency is handled in the database, not in application code
- **Overpayment race:** the payment is applied with a single guarded `$inc` whose filter asserts the new total stays within `totalRepayment`. Two executives recording a payment simultaneously cannot both succeed — a read-then-write check would let both through.
- **Duplicate loans:** a *partial unique index* on `userId` (limited to active statuses) means the database itself refuses a second active loan, so a double-clicked Apply button cannot create two.
- **Double approval:** every status change re-asserts the expected current status inside the update filter.
- Payments run in a transaction where the deployment supports one (Atlas does), with a safe non-transactional fallback for standalone MongoDB.

### Uploads are not publicly served
The uploads directory is deliberately **not** exposed as static files — otherwise anyone who guessed a filename could read someone's salary slip. Slips are streamed through an authenticated, role-checked route, files are stored under random names, and the absolute path is stripped from every API response.

---

## Project structure

```
backend/src/
  config/       env (zod-validated), db
  models/       user, application, loan, payment
  middleware/   authenticate, requireRole, validate, upload, errorHandler
  services/     bre, loan-math, loan-status, payment
  controllers/  auth, application, loan, sales, dashboard
  routes/       one router per module
  validators/   zod schemas
  utils/        ApiError, asyncHandler, money, constants
  seed/         seed.ts
frontend/
  app/          (auth)/login, (auth)/signup, apply, dashboard/{sales,sanction,disbursement,collection}
  components/   ui, apply, dashboard
  lib/          api, auth-context, bre, loanMath, constants, types
  middleware.ts route guarding
```

---

## Access control

Enforced in **both** layers, because hiding a menu item is not security:

- **Backend** — `authenticate` verifies the JWT (`401` if missing/invalid), then `requireRole(...)` checks the role (`403` if wrong). Admin passes every staff gate; borrowers are blocked from the dashboard and staff from the borrower portal.
- **Frontend** — `middleware.ts` decodes the cookie and redirects before a page renders; the dashboard nav only shows modules the role may open.

The middleware decodes the JWT **without verifying the signature**, which is intentional: it only chooses which page to show. Every API call is verified server-side, so a forged cookie buys a redirect and nothing else.

---

## Environment variables

**backend/.env**

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development` / `production` |
| `PORT` | API port (default 5001) |
| `MONGODB_URI` | MongoDB connection string |
| `MONGODB_DB_NAME` | Database name (default `loan_management`) |
| `JWT_SECRET` | Signing secret, at least 16 characters |
| `JWT_EXPIRES_IN` | Token lifetime (default `1d`) |

**frontend/.env.local**

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base API URL, e.g. `http://localhost:5001/api` |

Startup fails fast with a readable message if any of these are missing or malformed.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start in watch mode |
| `npm run build` | Compile TypeScript / build Next.js |
| `npm start` | Run the production build |
| `npm run seed` | Create the six role accounts (backend) |
| `npm run typecheck` | Type-check without emitting |
| `npm run test:e2e` | Drive the whole lifecycle against a live API (backend) |

---

## Verification

`cd backend && npm run test:e2e` starts its own server, seeds the database, and asserts 31 checks
covering the complete flow:

- unauthenticated `401`, wrong-role `403`, admin reaching all four modules, admin blocked from the borrower portal
- a `role` field in the signup body is ignored
- BRE rejection reporting all four failures at once, then a passing submission
- applying before uploading a slip is blocked; a `.txt` upload is rejected
- simple interest and total repayment (₹100,000 / 90 days → ₹2,958.90 / ₹102,958.90)
- a second active loan and an out-of-range principal are refused
- sanction → disburse, and re-approving an already-sanctioned loan is refused
- partial payment, duplicate UTR refused, overpayment refused, final payment auto-closing the loan,
  and payments against a closed loan refused

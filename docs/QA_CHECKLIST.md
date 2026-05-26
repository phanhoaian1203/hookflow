# HookFlow — Quality Assurance (QA) Verification Checklist

This checklist defines the rigorous testing protocols required to verify HookFlow's components across development, staging, and production environments.

---

## 🔐 1. Authentication & Security Gate Checks

- [ ] **Account Registration Flow:**
  - Verify that attempting to register with an existing email throws a `409 Conflict` (handled cleanly by the UI toast notification).
  - Verify password strength validators (requires length ≥ 8, throws validation warnings if failed).
- [ ] **Secure Login & Sessioning:**
  - Verify that login with correct credentials yields a JWT access token.
  - Verify that token is stored inside local browser storage as `hf_token`.
  - Verify that entering unauthorized URLs directly redirects the user cleanly back to `/login` (route guard testing).
- [ ] **Logout Routing:**
  - Verify that clicking Logout deletes the browser's token and clears local user states instantly.

---

## 📂 2. Projects & Workspace Isolation Checks

- [ ] **Project Creation & Validation:**
  - Verify that creating a project with a blank name throws a validation error.
  - Verify that newly created projects immediately appear inside the project selection dropdown.
- [ ] **Workspace Isolation Boundaries:**
  - Log in with Account A, create a project, and verify it cannot be seen or altered by Account B (enforcing EF Core query constraints: `OwnerId == UserId`).

---

## 🌐 3. Webhook Endpoints & Routing Checks

- [ ] **Endpoint Configurations:**
  - Verify that creating a new endpoint automatically generates a unique slug (e.g. `github-hooks-a4fb`).
  - Verify that a secure signing secret key (`hf_sec_xxx`) is generated automatically.
- [ ] **Routing Slug Resolution:**
  - Verify that trigger requests to `/api/incoming-webhooks/{slug}` resolve and map to the correct DB endpoint.
  - Verify that calling inactive or disabled endpoints yields an HTTP `403 Forbidden` status.
  - Verify that calling non-existent slugs yields an HTTP `404 Not Found` status.

---

## 🧪 4. Webhook Simulator & HMAC Signature Checks

- [ ] **Payload Simulator UI:**
  - Verify that selecting an endpoint dynamically updates the target URL display in the simulator.
  - Verify that clicking "Generate Signature" compiles a valid HMAC SHA256 signature in the mock headers based on the endpoint's secret key and target payload.
- [ ] **HMAC Signature Gates:**
  - **Case 1: Valid Signature:** Send a request with a valid signature. Check that the event detail page lists `Signature Check` as **Valid** (green badge).
  - **Case 2: Invalid Signature:** Send a request with an altered payload or modified signature. Verify that the event is logged as **Invalid Signature** (red badge).
  - **Case 3: Unsigned payload:** Send a request without headers. Verify it is logged as **Not Checked** (gray badge).

---

## 🔄 5. Retry Engine & Exponential Backoff Checks

To verify the asynchronous retry queue without waiting hours, execute transient failure simulations:

- [ ] **Failure Simulation Trigger:**
  - Go to the **Simulator** page, select a project endpoint, and check the `"simulate_failure": true` toggle (or include it in the JSON).
  - Click **Send Webhook**.
- [ ] **Initial Capture Verification:**
  - Navigate to the **Event Logs** page.
  - Verify the new event captured is logged as `Status: Pending` initially, then moves to `Status: Retrying` after the worker's first delivery failure attempt.
- [ ] **Attempt History logging:**
  - Click on the event to view its **Event Detail** page.
  - Verify the **Processing Attempts** tab records `Attempt #1` with a `Failed` status, showing the exact error details and worker diagnostics.
- [ ] **Exponential Backoff Progression:**
  - Check that `NextRetryAt` is calculated and set according to the retry policy:
    - Attempt 1: Scheduled in +1 minute.
    - Attempt 2: Scheduled in +5 minutes.
    - Attempt 3: Scheduled in +15 minutes.
    - Attempt 4: Scheduled in +1 hour.
- [ ] **Dead Letter Queue (DLQ) Gate:**
  - Let the simulated webhook fail continuously.
  - Verify that after exceeding `MaxRetryAttempts = 5`, the status changes permanently to **Dead** (DLQ), and no further retry schedules are calculated.

---

## 🔁 6. Manual Replay Queue Diagnostics

- [ ] **Manual Replay Execution:**
  - Open a `Failed` or `Dead` event in the **Event Detail** page.
  - Click the **Replay Event** button at the top right.
  - Verify the status immediately changes back to **Pending**, and `RetryCount` resets to 0.
  - Verify that the background worker picks it up and runs a new delivery attempt immediately.
  - Look at the **Attempts** tab and verify the new attempts appear at the top.

---

## 📊 7. Dashboard Analytics Reactive Checks

- [ ] **Real-Time Data Aggregations:**
  - Verify that creating new endpoints or sending successful/failed webhooks immediately increments the metric cards (Total, Processed, Failed, Retrying, Dead) without refreshing the browser.
- [ ] **Weekly volume chart plotting:**
  - Verify that the weekly event volume chart correctly plots the daily counts, highlighting failures inside the daily bar segments.
- [ ] **Status Distribution Breakdown:**
  - Verify that the progress bars and percentages in the status distribution panel recalculate automatically and match the sum of events in the database.
- [ ] **Recent events listing:**
  - Verify that the bottom recent events table displays the correct live statuses and dates, and that clicking any event successfully redirects you to its deep detail log.

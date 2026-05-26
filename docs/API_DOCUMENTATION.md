# HookFlow — API Documentation

This document provides exhaustive specifications for all REST endpoints of the HookFlow Webhook Gateway.

* **Base URL (Local Development):** `http://localhost:5000/api`
* **Base URL (Production Cloud):** `https://hookflow-api.onrender.com/api`

---

## 🔑 Conventions & Global Protocols

### 1. Authentication Scheme
All endpoints except registration, login, and incoming webhook triggers require JWT authentication:
```http
Authorization: Bearer <your_jwt_access_token>
```
If the token expires or is invalid, the API returns a `401 Unauthorized` status.

### 2. Standard Response Wrapper
All API responses are wrapped in a unified JSON envelope:

#### Successful Response (`200 OK`, `201 Created`, `202 Accepted`):
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully.",
  "errors": null
}
```

#### Error Response (`400 Bad Request`, `401 Unauthorized`, `422 Unprocessable`):
```json
{
  "success": false,
  "data": null,
  "message": "Failed validation rules.",
  "errors": [
    "Email address is already in use.",
    "Password must contain at least one uppercase letter."
  ]
}
```

---

## 📂 API Endpoint Directory

### 🚪 Module 1: Authentication API

#### `POST /api/auth/register`
Creates a new developer account.
* **Authentication:** Public
* **Request Payload:**
  ```json
  {
    "fullName": "Phan Hoai An",
    "email": "demo@hookflow.com",
    "password": "password123",
    "confirmPassword": "password123"
  }
  ```
* **Success Response `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "id": "e2da4930-b302-4bb3-93d3-0d35d956f22a",
      "fullName": "Phan Hoai An",
      "email": "demo@hookflow.com",
      "createdAt": "2026-05-26T12:00:00Z"
    },
    "message": "User registered successfully",
    "errors": null
  }
  ```

#### `POST /api/auth/login`
Authenticates a user and returns a JWT access token.
* **Authentication:** Public
* **Request Payload:**
  ```json
  {
    "email": "demo@hookflow.com",
    "password": "password123"
  }
  ```
* **Success Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": "e2da4930-b302-4bb3-93d3-0d35d956f22a",
        "fullName": "Phan Hoai An",
        "email": "demo@hookflow.com"
      }
    },
    "message": "Login successful",
    "errors": null
  }
  ```

---

### 📂 Module 2: Projects API

#### `GET /api/projects`
Retrieves a list of all projects owned by the authenticated user.
* **Authentication:** Required (JWT)
* **Success Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "a576c6a4-4a25-4c0c-8438-fb36e885d56b",
        "name": "E-Commerce Gateway",
        "description": "Handles Stripe and PayPal webhooks.",
        "createdAt": "2026-05-26T12:05:00Z"
      }
    ],
    "message": "Projects retrieved successfully",
    "errors": null
  }
  ```

#### `POST /api/projects`
Creates a new project.
* **Request Payload:**
  ```json
  {
    "name": "GitHub Monitor",
    "description": "Monitors push and release events."
  }
  ```
* **Success Response `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "id": "b182cb05-2015-4fa2-9382-f049582d921b",
      "name": "GitHub Monitor",
      "description": "Monitors push and release events.",
      "createdAt": "2026-05-26T12:10:00Z"
    },
    "message": "Project created successfully",
    "errors": null
  }
  ```

---

### 🌐 Module 3: Webhook Endpoints API

#### `GET /api/projects/{projectId}/endpoints`
Gets all webhook endpoints configured under a specific project.
* **Success Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "c1982a01-4475-4bb3-94c6-218ab2a3c75d",
        "name": "Stripe Payments",
        "url": "https://api.my-app.com/webhooks/stripe",
        "slug": "stripe-payments-a4fb",
        "secretKey": "hf_sec_8fb4a19dc...",
        "createdAt": "2026-05-26T12:15:00Z"
      }
    ],
    "message": "Endpoints retrieved successfully",
    "errors": null
  }
  ```

---

### ⚡ Module 4: Incoming Webhooks API

#### `POST /api/incoming-webhooks/{slug}`
The primary gateway endpoint that receives incoming third-party webhooks.
* **Authentication:** Public (Uses HMAC signature checks if enabled).
* **Success Response `202 Accepted`:**
  ```json
  {
    "success": true,
    "data": {
      "eventId": "f581a95c-a5d6-44b2-a423-018dc6bb218a",
      "status": "Pending"
    },
    "message": "Webhook accepted and queued for processing.",
    "errors": null
  }
  ```

---

### 🔁 Module 5: Retry & Replay API

#### `POST /api/webhook-events/{id}/replay`
Manually triggers an immediate retry execution for a specific failed, dead, or processing webhook event.
* **Success Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "id": "f581a95c-a5d6-44b2-a423-018dc6bb218a",
      "status": "Pending",
      "retryCount": 0
    },
    "message": "Event successfully queued for replay",
    "errors": null
  }
  ```

---

### 📊 Module 6: Dashboard Analytics API (New in v1.4)

#### `GET /api/dashboard/summary`
Retrieves high-level aggregated metrics for the user's dashboard cards.
* **Authentication:** Required (JWT)
* **Success Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "totalEvents": 148,
      "processedEvents": 120,
      "failedEvents": 12,
      "retryingEvents": 6,
      "deadEvents": 10,
      "pendingEvents": 0,
      "failureRate": 14.86,
      "averageProcessingTimeMs": 182,
      "eventsToday": 34
    },
    "message": "Dashboard summary retrieved successfully",
    "errors": null
  }
  ```

#### `GET /api/dashboard/events-over-time`
Aggregates total webhook volumes and failures grouped by day for the last 7 days.
* **Authentication:** Required (JWT)
* **Success Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      { "day": "Wed", "count": 24, "failed": 2 },
      { "day": "Thu", "count": 18, "failed": 0 },
      { "day": "Fri", "count": 30, "failed": 4 },
      { "day": "Sat", "count": 12, "failed": 1 },
      { "day": "Sun", "count": 15, "failed": 1 },
      { "day": "Mon", "count": 22, "failed": 2 },
      { "day": "Tue", "count": 27, "failed": 2 }
    ],
    "message": "Events volume chart metrics retrieved successfully",
    "errors": null
  }
  ```

#### `GET /api/dashboard/status-distribution`
Retrieves total counts and percentage shares for all webhook statuses.
* **Authentication:** Required (JWT)
* **Success Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      { "status": "Processed", "count": 120, "percentage": 81.08 },
      { "status": "Failed", "count": 12, "percentage": 8.11 },
      { "status": "Dead", "count": 10, "percentage": 6.76 },
      { "status": "Retrying", "count": 6, "percentage": 4.05 }
    ],
    "message": "Status distribution chart metrics retrieved successfully",
    "errors": null
  }
  ```

#### `GET /api/dashboard/recent-events`
Pulls the top 5 most recent webhook events received across all projects owned by the user.
* **Authentication:** Required (JWT)
* **Success Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "d58a101b-94c6-43b2-ac88-fb36e885d56b",
        "endpointName": "Stripe Payments",
        "projectName": "E-Commerce Gateway",
        "eventType": "payment.succeeded",
        "status": "Processed",
        "receivedAt": "2026-05-26T13:00:00Z"
      }
    ],
    "message": "Recent events log retrieved successfully",
    "errors": null
  }
  ```

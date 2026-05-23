# HookFlow — API Design

> Tài liệu thiết kế REST API cho hệ thống HookFlow Webhook Event Processor.
> Base URL: `http://localhost:5000/api` (development)

---

## Conventions

### Authentication
Hầu hết API yêu cầu JWT Bearer token:
```
Authorization: Bearer <access_token>
```
Các API public (không cần auth): `POST /auth/register`, `POST /auth/login`, `POST /incoming-webhooks/{slug}`.

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "errors": null
}
```

Khi lỗi:
```json
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "errors": ["Email is already taken", "Password is too short"]
}
```

### Pagination
Các endpoint trả danh sách đều hỗ trợ:
```
GET /api/webhook-events?page=1&pageSize=20
```
Response:
```json
{
  "items": [...],
  "page": 1,
  "pageSize": 20,
  "totalItems": 150,
  "totalPages": 8,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

### HTTP Status Codes

| Code | Nghĩa |
|------|-------|
| `200 OK` | Thành công, có data trả về |
| `201 Created` | Tạo mới thành công |
| `202 Accepted` | Đã nhận, xử lý sau (webhook receiver) |
| `204 No Content` | Thành công, không có data trả về |
| `400 Bad Request` | Input không hợp lệ |
| `401 Unauthorized` | Chưa đăng nhập hoặc token hết hạn |
| `403 Forbidden` | Không có quyền truy cập |
| `404 Not Found` | Resource không tồn tại |
| `409 Conflict` | Xung đột dữ liệu (vd: email đã tồn tại) |
| `422 Unprocessable Entity` | Validation lỗi |
| `500 Internal Server Error` | Lỗi server |

---

## Module 1: Authentication API

### `POST /api/auth/register`
Đăng ký tài khoản mới.

**Request:**
```json
{
  "fullName": "Ngoc Anh",
  "email": "ngocanh@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!"
}
```

**Validation:**
- `fullName`: required, 2–100 ký tự
- `email`: required, valid email format, unique
- `password`: required, ≥ 8 ký tự, có chữ hoa, chữ thường, số
- `confirmPassword`: phải match `password`

**Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "Ngoc Anh",
    "email": "ngocanh@example.com",
    "role": "User",
    "createdAt": "2026-05-23T10:30:00Z"
  },
  "message": "Registration successful"
}
```

**Error `409 Conflict`:** Email đã tồn tại.

---

### `POST /api/auth/login`
Đăng nhập, nhận JWT token.

**Request:**
```json
{
  "email": "ngocanh@example.com",
  "password": "Password123!"
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
    "expiresAt": "2026-05-23T11:30:00Z",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "fullName": "Ngoc Anh",
      "email": "ngocanh@example.com",
      "role": "User"
    }
  }
}
```

**Error `401`:** Sai email hoặc password.

---

### `POST /api/auth/refresh`
Gia hạn access token bằng refresh token.

**Request:**
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
}
```

**Response `200 OK`:** Trả về `accessToken` và `refreshToken` mới.

---

### `POST /api/auth/logout` 🔒
Đăng xuất, invalidate refresh token.

**Response `204 No Content`**

---

### `GET /api/auth/me` 🔒
Lấy thông tin user hiện tại.

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-...",
    "fullName": "Ngoc Anh",
    "email": "ngocanh@example.com",
    "role": "User",
    "createdAt": "2026-05-23T10:30:00Z"
  }
}
```

---

### `PUT /api/auth/change-password` 🔒
Đổi mật khẩu.

**Request:**
```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword456!",
  "confirmNewPassword": "NewPassword456!"
}
```

**Response `204 No Content`**

---

## Module 2: Project API

### `GET /api/projects` 🔒
Danh sách project của user hiện tại.

**Query params:** `page`, `pageSize`, `status`, `search`

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "name": "Alpha E-commerce",
        "description": "Payment and order webhooks",
        "status": "Active",
        "endpointCount": 4,
        "eventCount": 152,
        "createdAt": "2026-05-01T10:00:00Z",
        "updatedAt": "2026-05-23T08:00:00Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalItems": 4,
    "totalPages": 1
  }
}
```

---

### `POST /api/projects` 🔒
Tạo project mới.

**Request:**
```json
{
  "name": "GitHub Monitor",
  "description": "Track GitHub events"
}
```

**Response `201 Created`:** Trả về project vừa tạo.

---

### `GET /api/projects/{id}` 🔒
Chi tiết một project.

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Alpha E-commerce",
    "description": "...",
    "status": "Active",
    "endpoints": [
      {
        "id": "...",
        "name": "Payment Success",
        "slug": "payment-success",
        "provider": "GenericHmac",
        "isActive": true,
        "eventCount": 45
      }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### `PUT /api/projects/{id}` 🔒
Cập nhật project.

**Request:**
```json
{
  "name": "Alpha E-commerce Updated",
  "description": "Updated description",
  "status": "Active"
}
```

**Response `200 OK`:** Trả về project đã cập nhật.

---

### `DELETE /api/projects/{id}` 🔒
Xóa project (cascade xóa endpoint và event).

**Response `204 No Content`**

---

## Module 3: Webhook Endpoint API

### `GET /api/webhook-endpoints` 🔒
Danh sách tất cả endpoint của user.

**Query params:** `projectId`, `isActive`, `provider`, `page`, `pageSize`

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "projectId": "...",
        "projectName": "Alpha E-commerce",
        "name": "Payment Success",
        "slug": "payment-success",
        "webhookUrl": "https://hookflow.app/api/incoming-webhooks/payment-success",
        "provider": "GenericHmac",
        "isActive": true,
        "allowedEventTypes": ["payment.success", "payment.failed"],
        "maxRetryAttempts": 5,
        "eventsToday": 12,
        "failureRate": 0.08,
        "lastReceivedAt": "2026-05-23T10:25:00Z",
        "createdAt": "..."
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalItems": 8
  }
}
```

---

### `POST /api/webhook-endpoints` 🔒
Tạo webhook endpoint mới.

**Request:**
```json
{
  "projectId": "550e8400-...",
  "name": "Payment Success",
  "description": "Receive payment confirmation webhooks",
  "provider": "GenericHmac",
  "allowedEventTypes": ["payment.success", "payment.failed"],
  "signatureHeaderName": "X-Webhook-Signature",
  "rejectInvalidSignature": true,
  "maxRetryAttempts": 5,
  "retryStrategy": "ExponentialBackoff"
}
```

**Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Payment Success",
    "slug": "payment-success",
    "webhookUrl": "http://localhost:5000/api/incoming-webhooks/payment-success",
    "secretKey": "wh_sk_abc123...",
    "provider": "GenericHmac",
    "isActive": true,
    "createdAt": "..."
  },
  "message": "Endpoint created. Save the secret key — it will not be shown again."
}
```

> ⚠️ `secretKey` chỉ được hiển thị một lần khi tạo. Sau đó không thể xem lại.

---

### `GET /api/webhook-endpoints/{id}` 🔒
Chi tiết một endpoint.

**Response `200 OK`:** Chi tiết đầy đủ nhưng không trả về `secretKey` plaintext.

---

### `PUT /api/webhook-endpoints/{id}` 🔒
Cập nhật endpoint.

---

### `PATCH /api/webhook-endpoints/{id}/toggle` 🔒
Bật hoặc tắt endpoint.

**Response `200 OK`:**
```json
{
  "success": true,
  "data": { "isActive": false },
  "message": "Endpoint disabled"
}
```

---

### `POST /api/webhook-endpoints/{id}/rotate-secret` 🔒
Tạo lại secret key mới.

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "secretKey": "wh_sk_xyz789..."
  },
  "message": "Secret rotated. Update your provider's webhook configuration."
}
```

---

### `DELETE /api/webhook-endpoints/{id}` 🔒
Xóa endpoint.

**Response `204 No Content`**

---

## Module 4: Incoming Webhook API (Public)

### `POST /api/incoming-webhooks/{slug}`
**⚠️ Public endpoint — không cần auth token.**

Đây là URL mà external service (GitHub, payment gateway…) gửi webhook đến.

**Headers thường gặp:**
```
Content-Type: application/json
X-Webhook-Event: payment.success
X-Webhook-Signature: sha256=abc123def456...
X-Request-ID: req_123456
User-Agent: PaymentProvider/1.0
```

**Request body (example):**
```json
{
  "event": "payment.success",
  "orderId": "ORD-2026-001",
  "amount": 350000,
  "currency": "VND",
  "transactionId": "TXN-88421"
}
```

**Response `200 OK` (Nhận thành công):**
```json
{
  "success": true,
  "data": {
    "eventId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "Pending"
  },
  "message": "Webhook received"
}
```

**Response `200 OK` (Duplicate):**
```json
{
  "success": true,
  "data": { "status": "Duplicate" },
  "message": "Event already received"
}
```

**Các response lỗi:**

| Status | Khi nào |
|--------|---------|
| `404` | Slug không tồn tại |
| `403` | Endpoint bị inactive |
| `400` | Signature không hợp lệ (khi `rejectInvalidSignature = true`) |

**Luồng xử lý:**
```
1. Tìm endpoint theo slug → 404 nếu không có
2. Check isActive → 403 nếu false
3. Đọc raw body (EnableBuffering để giữ stream)
4. Đọc headers
5. Extract event type (từ header X-Webhook-Event hoặc body.event)
6. Check AllowedEventTypes → Ignored nếu không match
7. Verify HMAC signature nếu endpoint yêu cầu
8. Check ExternalEventId → Duplicate nếu đã tồn tại
9. Save WebhookEvent (Status = Pending)
10. Return 200 OK (nhanh nhất có thể)
```

---

## Module 5: Event Logs API

### `GET /api/webhook-events` 🔒
Danh sách webhook events với filter và pagination.

**Query params:**

| Param | Type | Mô tả |
|-------|------|-------|
| `page` | int | Trang hiện tại (default: 1) |
| `pageSize` | int | Số item/trang (default: 20, max: 100) |
| `projectId` | uuid | Lọc theo project |
| `endpointId` | uuid | Lọc theo endpoint |
| `status` | string | `Pending,Processing,Processed,Failed,Retrying,Dead,Ignored,InvalidSignature,Duplicate` |
| `eventType` | string | Lọc theo event type (contains) |
| `fromDate` | datetime | Từ ngày (ISO 8601) |
| `toDate` | datetime | Đến ngày (ISO 8601) |
| `search` | string | Tìm trong eventType hoặc eventId |
| `signatureValid` | bool | Lọc theo signature status |

**Example:**
```
GET /api/webhook-events?status=Failed,Dead&projectId=xxx&page=1&pageSize=20
```

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "550e8400-...",
        "eventType": "payment.success",
        "endpointId": "...",
        "endpointName": "Payment Success",
        "projectName": "Alpha E-commerce",
        "provider": "GenericHmac",
        "status": "Processed",
        "signatureValid": true,
        "retryCount": 0,
        "receivedAt": "2026-05-23T10:30:00Z",
        "processedAt": "2026-05-23T10:30:05Z",
        "durationMs": 145
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalItems": 150,
    "totalPages": 8,
    "hasNextPage": true
  }
}
```

---

### `GET /api/webhook-events/{id}` 🔒
Chi tiết đầy đủ của một event (dùng để debug).

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-...",
    "eventType": "payment.success",
    "endpoint": {
      "id": "...",
      "name": "Payment Success",
      "slug": "payment-success",
      "provider": "GenericHmac"
    },
    "project": {
      "id": "...",
      "name": "Alpha E-commerce"
    },
    "status": "Processed",
    "signatureValid": true,
    "retryCount": 0,
    "sourceIp": "192.168.1.100",
    "payloadJson": {
      "event": "payment.success",
      "orderId": "ORD-2026-001",
      "amount": 350000
    },
    "headersJson": {
      "content-type": "application/json",
      "x-webhook-event": "payment.success",
      "x-webhook-signature": "sha256=abc123"
    },
    "receivedAt": "2026-05-23T10:30:00Z",
    "processedAt": "2026-05-23T10:30:05Z",
    "processingAttempts": [
      {
        "id": "...",
        "attemptNumber": 1,
        "status": "Success",
        "startedAt": "2026-05-23T10:30:01Z",
        "finishedAt": "2026-05-23T10:30:05Z",
        "durationMs": 145,
        "errorMessage": null,
        "workerName": "worker-1"
      }
    ]
  }
}
```

---

### `POST /api/webhook-events/{id}/replay` 🔒
Replay một event (reset về Pending để worker xử lý lại).

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "eventId": "...",
    "status": "Pending",
    "message": "Event queued for reprocessing"
  }
}
```

---

### `POST /api/webhook-events/{id}/ignore` 🔒
Đánh dấu event là Ignored (không xử lý nữa).

**Response `200 OK`**

---

### `GET /api/webhook-events/retry-queue` 🔒
Danh sách event đang Retrying hoặc Dead.

**Query params:** `status` (default: `Retrying,Dead`), `projectId`, `page`, `pageSize`

---

## Module 6: Dashboard API

### `GET /api/dashboard/summary` 🔒
Số liệu tổng quan.

**Query params:** `projectId` (optional), `period` (default: `7d`, options: `24h`, `7d`, `30d`)

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "totalEvents": 1250,
    "processedEvents": 1180,
    "failedEvents": 45,
    "retryingEvents": 12,
    "deadEvents": 8,
    "pendingEvents": 5,
    "failureRate": 0.042,
    "avgProcessingTimeMs": 234,
    "eventsToday": 87,
    "period": "7d"
  }
}
```

---

### `GET /api/dashboard/events-over-time` 🔒
Dữ liệu cho line chart.

**Query params:** `projectId`, `period` (default: `7d`), `interval` (`hour`, `day`)

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "labels": ["2026-05-17", "2026-05-18", "...", "2026-05-23"],
    "series": {
      "total": [120, 95, 110, 145, 88, 132, 87],
      "processed": [115, 90, 108, 140, 85, 128, 82],
      "failed": [5, 5, 2, 5, 3, 4, 5]
    }
  }
}
```

---

### `GET /api/dashboard/status-distribution` 🔒
Dữ liệu cho donut chart.

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    { "status": "Processed", "count": 1180, "percentage": 94.4 },
    { "status": "Failed", "count": 45, "percentage": 3.6 },
    { "status": "Retrying", "count": 12, "percentage": 0.96 },
    { "status": "Dead", "count": 8, "percentage": 0.64 },
    { "status": "Pending", "count": 5, "percentage": 0.4 }
  ]
}
```

---

### `GET /api/dashboard/recent-events` 🔒
10 event gần nhất.

---

### `GET /api/health`
Health check endpoint (public, không cần auth).

**Response `200 OK`:**
```json
{
  "status": "healthy",
  "service": "HookFlow.Api",
  "version": "1.0.0",
  "timestamp": "2026-05-23T10:30:00Z",
  "checks": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

---

## Tóm tắt tất cả Endpoints

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | `/api/auth/register` | ❌ | Đăng ký |
| POST | `/api/auth/login` | ❌ | Đăng nhập |
| POST | `/api/auth/refresh` | ❌ | Refresh token |
| POST | `/api/auth/logout` | ✅ | Đăng xuất |
| GET | `/api/auth/me` | ✅ | Profile |
| PUT | `/api/auth/change-password` | ✅ | Đổi mật khẩu |
| GET | `/api/projects` | ✅ | Danh sách projects |
| POST | `/api/projects` | ✅ | Tạo project |
| GET | `/api/projects/{id}` | ✅ | Chi tiết project |
| PUT | `/api/projects/{id}` | ✅ | Cập nhật project |
| DELETE | `/api/projects/{id}` | ✅ | Xóa project |
| GET | `/api/webhook-endpoints` | ✅ | Danh sách endpoints |
| POST | `/api/webhook-endpoints` | ✅ | Tạo endpoint |
| GET | `/api/webhook-endpoints/{id}` | ✅ | Chi tiết endpoint |
| PUT | `/api/webhook-endpoints/{id}` | ✅ | Cập nhật endpoint |
| PATCH | `/api/webhook-endpoints/{id}/toggle` | ✅ | Bật/tắt |
| POST | `/api/webhook-endpoints/{id}/rotate-secret` | ✅ | Rotate secret |
| DELETE | `/api/webhook-endpoints/{id}` | ✅ | Xóa endpoint |
| **POST** | **`/api/incoming-webhooks/{slug}`** | **❌** | **Nhận webhook** |
| GET | `/api/webhook-events` | ✅ | Danh sách events |
| GET | `/api/webhook-events/{id}` | ✅ | Chi tiết event |
| POST | `/api/webhook-events/{id}/replay` | ✅ | Replay event |
| POST | `/api/webhook-events/{id}/ignore` | ✅ | Ignore event |
| GET | `/api/webhook-events/retry-queue` | ✅ | Retry queue |
| GET | `/api/dashboard/summary` | ✅ | Dashboard metrics |
| GET | `/api/dashboard/events-over-time` | ✅ | Chart data |
| GET | `/api/dashboard/status-distribution` | ✅ | Donut chart |
| GET | `/api/dashboard/recent-events` | ✅ | Recent events |
| GET | `/api/health` | ❌ | Health check |

---

*Tài liệu này thuộc về dự án HookFlow — Webhook Event Processor*
*Phiên bản tài liệu: 1.0 | Cập nhật: 2026*

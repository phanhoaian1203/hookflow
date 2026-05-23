# HookFlow — Database Design

> Tài liệu thiết kế database schema cho hệ thống HookFlow Webhook Event Processor.
> Database: **PostgreSQL 16**. ORM: **Entity Framework Core 8**.

---

## 1. Tổng quan Schema

```
Users
  └── Projects (OwnerId → Users.Id)
       └── WebhookEndpoints (ProjectId → Projects.Id)
            └── WebhookEvents (EndpointId → WebhookEndpoints.Id)
                 └── ProcessingAttempts (WebhookEventId → WebhookEvents.Id)

Users
  └── AuditLogs (UserId → Users.Id)
```

---

## 2. Bảng `Users`

Lưu thông tin người dùng của hệ thống.

### Schema

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `Id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `FullName` | `varchar(100)` | NO | — | Tên đầy đủ |
| `Email` | `varchar(255)` | NO | — | Email đăng nhập (unique) |
| `PasswordHash` | `varchar(255)` | NO | — | BCrypt hash của password |
| `Role` | `varchar(50)` | NO | `'User'` | Role: `User`, `Admin` |
| `IsActive` | `boolean` | NO | `true` | Tài khoản còn active không |
| `CreatedAt` | `timestamptz` | NO | `now()` | Thời điểm tạo |
| `UpdatedAt` | `timestamptz` | NO | `now()` | Thời điểm cập nhật cuối |

### Indexes

```sql
CREATE UNIQUE INDEX idx_users_email ON Users(Email);
CREATE INDEX idx_users_created_at ON Users(CreatedAt DESC);
```

### Entity C#

```csharp
public class User
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "User";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<Project> Projects { get; set; } = [];
    public ICollection<AuditLog> AuditLogs { get; set; } = [];
}
```

### Business Rules
- Email phải unique trong toàn hệ thống
- Password không bao giờ được lưu dưới dạng plaintext
- `IsActive = false` = tài khoản bị khóa, không thể đăng nhập

---

## 3. Bảng `Projects`

Lưu thông tin project của user. Mỗi user có nhiều project để gom nhóm webhook endpoint.

### Schema

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `Id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `OwnerId` | `uuid` | NO | — | FK → Users.Id |
| `Name` | `varchar(100)` | NO | — | Tên project |
| `Description` | `text` | YES | `null` | Mô tả project |
| `Status` | `varchar(20)` | NO | `'Active'` | `Active`, `Inactive`, `Archived` |
| `CreatedAt` | `timestamptz` | NO | `now()` | Thời điểm tạo |
| `UpdatedAt` | `timestamptz` | NO | `now()` | Thời điểm cập nhật cuối |

### Indexes

```sql
CREATE INDEX idx_projects_owner_id ON Projects(OwnerId);
CREATE INDEX idx_projects_status ON Projects(Status);
CREATE INDEX idx_projects_created_at ON Projects(CreatedAt DESC);
```

### Foreign Keys

```sql
ALTER TABLE Projects
ADD CONSTRAINT fk_projects_owner
FOREIGN KEY (OwnerId) REFERENCES Users(Id) ON DELETE CASCADE;
```

### Entity C#

```csharp
public class Project
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public User Owner { get; set; } = null!;
    public ICollection<WebhookEndpoint> Endpoints { get; set; } = [];
}
```

### Business Rules
- User chỉ thấy và sửa được project của mình (`OwnerId = currentUserId`)
- Khi xóa project → cascade xóa endpoint và event liên quan

---

## 4. Bảng `WebhookEndpoints`

Lưu cấu hình từng webhook endpoint. Đây là "cửa nhận webhook" với URL và secret riêng.

### Schema

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `Id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `ProjectId` | `uuid` | NO | — | FK → Projects.Id |
| `Name` | `varchar(100)` | NO | — | Tên endpoint |
| `Description` | `text` | YES | `null` | Mô tả |
| `Slug` | `varchar(100)` | NO | — | URL slug (unique toàn hệ thống) |
| `Provider` | `varchar(50)` | NO | `'Generic'` | Xem enum `WebhookProvider` |
| `SecretKey` | `varchar(512)` | YES | `null` | Secret key (encrypted/hashed) |
| `IsActive` | `boolean` | NO | `true` | Endpoint đang active không |
| `AllowedEventTypes` | `text[]` | YES | `null` | Danh sách event types được phép |
| `SignatureHeaderName` | `varchar(100)` | NO | `'X-Webhook-Signature'` | Tên header chứa signature |
| `RejectInvalidSignature` | `boolean` | NO | `false` | Reject request nếu signature sai |
| `MaxRetryAttempts` | `int` | NO | `5` | Số lần retry tối đa |
| `RetryStrategy` | `varchar(50)` | NO | `'ExponentialBackoff'` | Xem enum `RetryStrategy` |
| `CreatedAt` | `timestamptz` | NO | `now()` | Thời điểm tạo |
| `UpdatedAt` | `timestamptz` | NO | `now()` | Thời điểm cập nhật cuối |

### Indexes

```sql
CREATE UNIQUE INDEX idx_endpoints_slug ON WebhookEndpoints(Slug);
CREATE INDEX idx_endpoints_project_id ON WebhookEndpoints(ProjectId);
CREATE INDEX idx_endpoints_is_active ON WebhookEndpoints(IsActive);
CREATE INDEX idx_endpoints_provider ON WebhookEndpoints(Provider);
```

### Enums

```csharp
public enum WebhookProvider
{
    Generic,        // Bất kỳ nguồn nào
    GitHub,         // GitHub webhooks
    GenericHmac,    // HMAC-based providers
    Payment,        // Payment gateways
    CiCd,           // CI/CD systems
    Internal        // Internal services
}

public enum RetryStrategy
{
    None,
    LinearBackoff,
    ExponentialBackoff  // Default: 1m → 5m → 15m → 1h
}
```

### Entity C#

```csharp
public class WebhookEndpoint
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Slug { get; set; } = string.Empty;
    public WebhookProvider Provider { get; set; } = WebhookProvider.Generic;
    public string? SecretKey { get; set; }
    public bool IsActive { get; set; } = true;
    public string[]? AllowedEventTypes { get; set; }
    public string SignatureHeaderName { get; set; } = "X-Webhook-Signature";
    public bool RejectInvalidSignature { get; set; } = false;
    public int MaxRetryAttempts { get; set; } = 5;
    public RetryStrategy RetryStrategy { get; set; } = RetryStrategy.ExponentialBackoff;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public Project Project { get; set; } = null!;
    public ICollection<WebhookEvent> Events { get; set; } = [];
}
```

### Business Rules
- Slug phải unique toàn hệ thống (tạo URL: `/api/incoming-webhooks/{slug}`)
- Secret key lưu dạng encrypted (không phải plaintext, không phải bcrypt vì cần decrypt để verify HMAC)
- Khi `IsActive = false`: reject tất cả request đến endpoint này (403)
- `AllowedEventTypes = null` nghĩa là chấp nhận tất cả event type

---

## 5. Bảng `WebhookEvents`

**Bảng quan trọng nhất**. Lưu từng webhook event được nhận, kèm toàn bộ payload, headers, trạng thái xử lý.

### Schema

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `Id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `EndpointId` | `uuid` | NO | — | FK → WebhookEndpoints.Id |
| `ExternalEventId` | `varchar(255)` | YES | `null` | Event ID từ provider (để check duplicate) |
| `EventType` | `varchar(100)` | YES | `null` | Loại event (vd: `payment.success`) |
| `PayloadJson` | `jsonb` | YES | `null` | Raw request body (JSON) |
| `HeadersJson` | `jsonb` | YES | `null` | Request headers (JSON object) |
| `SourceIp` | `varchar(45)` | YES | `null` | IP gửi request |
| `SignatureValid` | `boolean` | YES | `null` | Null=chưa check, True=hợp lệ, False=không hợp lệ |
| `Status` | `varchar(30)` | NO | `'Pending'` | Xem enum `WebhookEventStatus` |
| `RetryCount` | `int` | NO | `0` | Số lần đã retry |
| `NextRetryAt` | `timestamptz` | YES | `null` | Thời điểm retry tiếp theo |
| `ErrorMessage` | `text` | YES | `null` | Lỗi của lần xử lý cuối |
| `ReceivedAt` | `timestamptz` | NO | `now()` | Thời điểm nhận được |
| `ProcessedAt` | `timestamptz` | YES | `null` | Thời điểm xử lý thành công |
| `CreatedAt` | `timestamptz` | NO | `now()` | Thời điểm ghi vào DB |

### Indexes

```sql
CREATE INDEX idx_events_endpoint_id ON WebhookEvents(EndpointId);
CREATE INDEX idx_events_status ON WebhookEvents(Status);
CREATE INDEX idx_events_received_at ON WebhookEvents(ReceivedAt DESC);
CREATE INDEX idx_events_event_type ON WebhookEvents(EventType);
CREATE INDEX idx_events_next_retry_at ON WebhookEvents(NextRetryAt) WHERE Status = 'Retrying';
CREATE INDEX idx_events_external_event_id ON WebhookEvents(ExternalEventId) WHERE ExternalEventId IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX idx_events_endpoint_status ON WebhookEvents(EndpointId, Status);
CREATE INDEX idx_events_status_received ON WebhookEvents(Status, ReceivedAt DESC);
```

### Enum: `WebhookEventStatus`

```csharp
public enum WebhookEventStatus
{
    Pending,            // Đã nhận, đang chờ worker xử lý
    Processing,         // Worker đang xử lý
    Processed,          // Xử lý thành công
    Failed,             // Xử lý thất bại (lần cuối)
    Retrying,           // Đã lỗi, đang chờ retry
    Dead,               // Đã retry hết lượt, không tự động retry nữa
    Ignored,            // Bị bỏ qua có chủ đích (event type không hợp lệ)
    InvalidSignature,   // Signature không hợp lệ
    Duplicate           // Event ID đã tồn tại trước đó
}
```

### Entity C#

```csharp
public class WebhookEvent
{
    public Guid Id { get; set; }
    public Guid EndpointId { get; set; }
    public string? ExternalEventId { get; set; }
    public string? EventType { get; set; }
    public string? PayloadJson { get; set; }
    public string? HeadersJson { get; set; }
    public string? SourceIp { get; set; }
    public bool? SignatureValid { get; set; }
    public WebhookEventStatus Status { get; set; } = WebhookEventStatus.Pending;
    public int RetryCount { get; set; } = 0;
    public DateTime? NextRetryAt { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime ReceivedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public WebhookEndpoint Endpoint { get; set; } = null!;
    public ICollection<ProcessingAttempt> ProcessingAttempts { get; set; } = [];
}
```

### Business Rules
- Event được lưu **ngay lập tức** khi nhận request (dù chưa xử lý)
- `ExternalEventId` được dùng để phát hiện duplicate. Nếu đã tồn tại → `Status = Duplicate`
- `PayloadJson` lưu **raw JSON body** không bị modify
- `HeadersJson` lưu **tất cả headers** dưới dạng JSON object
- Worker chỉ xử lý event có `Status = Pending`
- Worker cũng xử lý event có `Status = Retrying` và `NextRetryAt <= now()`

### Retry Schedule

| Lần retry | Delay |
|-----------|-------|
| 1 | 1 phút |
| 2 | 5 phút |
| 3 | 15 phút |
| 4 | 1 giờ |
| > MaxRetry | `Status = Dead` |

---

## 6. Bảng `ProcessingAttempts`

Lưu lịch sử từng lần worker cố xử lý event. Cho phép debug chính xác lần nào thành công/thất bại.

### Schema

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `Id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `WebhookEventId` | `uuid` | NO | — | FK → WebhookEvents.Id |
| `AttemptNumber` | `int` | NO | — | Thứ tự lần xử lý (1, 2, 3…) |
| `Status` | `varchar(20)` | NO | — | `Success`, `Failed` |
| `StartedAt` | `timestamptz` | NO | `now()` | Bắt đầu xử lý |
| `FinishedAt` | `timestamptz` | YES | `null` | Kết thúc xử lý |
| `DurationMs` | `int` | YES | `null` | Thời gian xử lý (milliseconds) |
| `ErrorMessage` | `text` | YES | `null` | Chi tiết lỗi nếu thất bại |
| `WorkerName` | `varchar(100)` | YES | `null` | Tên worker instance đã xử lý |
| `CreatedAt` | `timestamptz` | NO | `now()` | Thời điểm ghi |

### Indexes

```sql
CREATE INDEX idx_attempts_event_id ON ProcessingAttempts(WebhookEventId);
CREATE INDEX idx_attempts_event_number ON ProcessingAttempts(WebhookEventId, AttemptNumber);
```

### Entity C#

```csharp
public class ProcessingAttempt
{
    public Guid Id { get; set; }
    public Guid WebhookEventId { get; set; }
    public int AttemptNumber { get; set; }
    public string Status { get; set; } = string.Empty; // "Success" | "Failed"
    public DateTime StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public int? DurationMs { get; set; }
    public string? ErrorMessage { get; set; }
    public string? WorkerName { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public WebhookEvent WebhookEvent { get; set; } = null!;
}
```

### Ví dụ data

```
AttemptNumber | Status  | DurationMs | ErrorMessage
------------- | ------- | ---------- | --------------------------------
1             | Failed  | 3001       | Database connection timeout
2             | Failed  | 2500       | Email service unavailable
3             | Success | 145        | null
```

---

## 7. Bảng `AuditLogs` *(Optional — Phase 2)*

Lưu hành động quan trọng của user để audit trail.

### Schema

| Column | Type | Nullable | Mô tả |
|--------|------|----------|-------|
| `Id` | `uuid` | NO | Primary key |
| `UserId` | `uuid` | YES | FK → Users.Id (null nếu system action) |
| `Action` | `varchar(100)` | NO | Hành động (vd: `endpoint.secret.rotated`) |
| `EntityType` | `varchar(100)` | YES | Loại entity bị tác động |
| `EntityId` | `uuid` | YES | ID của entity |
| `OldValue` | `jsonb` | YES | Giá trị cũ (trước thay đổi) |
| `NewValue` | `jsonb` | YES | Giá trị mới (sau thay đổi) |
| `IpAddress` | `varchar(45)` | YES | IP thực hiện |
| `CreatedAt` | `timestamptz` | NO | Thời điểm xảy ra |

### Ví dụ Audit Log Entries

```json
{ "action": "endpoint.secret.rotated", "entityType": "WebhookEndpoint", "entityId": "..." }
{ "action": "event.replayed", "entityType": "WebhookEvent", "entityId": "..." }
{ "action": "endpoint.disabled", "entityType": "WebhookEndpoint", "entityId": "..." }
{ "action": "user.password.changed", "entityType": "User", "entityId": "..." }
```

---

## 8. Migration Strategy

### Initial Migration (v0.3)

```bash
# Tạo migration đầu tiên
dotnet ef migrations add InitialCreate --project HookFlow.Infrastructure --startup-project HookFlow.Api

# Apply migration
dotnet ef database update --project HookFlow.Infrastructure --startup-project HookFlow.Api
```

### Migration Naming Convention

```
InitialCreate           # v0.3 — Tạo tất cả bảng
AddSignatureFields      # v1.1 — Thêm SignatureValid, SecretKey
AddRetryFields          # v1.3 — Thêm NextRetryAt, ErrorMessage
AddAuditLogs            # Phase 2 — Thêm bảng AuditLogs
```

---

## 9. Relationships Summary

| Relationship | Type | Cascade |
|-------------|------|---------|
| Users → Projects | 1:N | DELETE CASCADE |
| Projects → WebhookEndpoints | 1:N | DELETE CASCADE |
| WebhookEndpoints → WebhookEvents | 1:N | DELETE CASCADE |
| WebhookEvents → ProcessingAttempts | 1:N | DELETE CASCADE |
| Users → AuditLogs | 1:N | SET NULL (giữ log dù xóa user) |

---

## 10. Sample Data

### Ví dụ WebhookEvent record

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "endpointId": "550e8400-e29b-41d4-a716-446655440001",
  "externalEventId": "evt_1234567890",
  "eventType": "payment.success",
  "payloadJson": {
    "event": "payment.success",
    "orderId": "ORD-2026-001",
    "amount": 350000,
    "currency": "VND",
    "transactionId": "TXN-88421"
  },
  "headersJson": {
    "content-type": "application/json",
    "x-webhook-event": "payment.success",
    "x-webhook-signature": "sha256=abc123def456",
    "user-agent": "PaymentProvider/1.0"
  },
  "sourceIp": "192.168.1.100",
  "signatureValid": true,
  "status": "Processed",
  "retryCount": 0,
  "nextRetryAt": null,
  "errorMessage": null,
  "receivedAt": "2026-05-23T10:30:00Z",
  "processedAt": "2026-05-23T10:30:05Z"
}
```

---

*Tài liệu này thuộc về dự án HookFlow — Webhook Event Processor*
*Phiên bản tài liệu: 1.0 | Cập nhật: 2026*

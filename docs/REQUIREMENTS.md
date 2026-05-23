# HookFlow — Requirements

> Tài liệu yêu cầu chức năng và phi chức năng của hệ thống HookFlow Webhook Event Processor.

---

## 1. Functional Requirements (Yêu cầu chức năng)

### 1.1 Authentication & User Management

| ID | Requirement | Priority |
|----|-------------|----------|
| AUTH-01 | User có thể đăng ký tài khoản mới bằng email và password | Must Have |
| AUTH-02 | User có thể đăng nhập bằng email và password | Must Have |
| AUTH-03 | Hệ thống cấp JWT access token sau khi đăng nhập thành công | Must Have |
| AUTH-04 | Hệ thống cấp refresh token để gia hạn access token | Should Have |
| AUTH-05 | User có thể đăng xuất (invalidate token) | Must Have |
| AUTH-06 | User có thể xem thông tin profile của mình | Must Have |
| AUTH-07 | User có thể đổi mật khẩu | Should Have |
| AUTH-08 | Email phải là duy nhất trong hệ thống | Must Have |
| AUTH-09 | Password phải được hash bằng BCrypt trước khi lưu | Must Have |

---

### 1.2 Project Management

| ID | Requirement | Priority |
|----|-------------|----------|
| PROJ-01 | User có thể tạo project mới với tên và mô tả | Must Have |
| PROJ-02 | User chỉ thấy danh sách project do mình sở hữu | Must Have |
| PROJ-03 | User có thể xem chi tiết một project | Must Have |
| PROJ-04 | User có thể cập nhật tên và mô tả project | Must Have |
| PROJ-05 | User có thể xóa project (và toàn bộ endpoint liên quan) | Must Have |
| PROJ-06 | Project name không được để trống | Must Have |
| PROJ-07 | User không thể xem hoặc sửa project của user khác | Must Have |
| PROJ-08 | Project có trạng thái: Active / Inactive | Should Have |

---

### 1.3 Webhook Endpoint Management

| ID | Requirement | Priority |
|----|-------------|----------|
| EP-01 | User có thể tạo webhook endpoint trong một project | Must Have |
| EP-02 | Hệ thống tự động sinh slug từ tên endpoint | Must Have |
| EP-03 | Hệ thống tự động sinh secret key khi tạo endpoint | Must Have |
| EP-04 | Hệ thống trả về webhook URL đầy đủ cho endpoint | Must Have |
| EP-05 | User có thể xem danh sách endpoint của một project | Must Have |
| EP-06 | User có thể xem chi tiết endpoint (URL, provider, settings) | Must Have |
| EP-07 | User có thể cập nhật thông tin endpoint | Must Have |
| EP-08 | User có thể bật/tắt endpoint (Active/Inactive) | Must Have |
| EP-09 | User có thể rotate (tạo lại) secret key | Must Have |
| EP-10 | User có thể cấu hình allowed event types | Should Have |
| EP-11 | User có thể bật/tắt signature verification | Should Have |
| EP-12 | User có thể cấu hình retry policy (max attempts) | Should Have |
| EP-13 | Slug phải là duy nhất trong toàn bộ hệ thống | Must Have |
| EP-14 | Provider được hỗ trợ: GitHub, GenericHmac, Payment, CI/CD | Should Have |

---

### 1.4 Incoming Webhook Receiver

| ID | Requirement | Priority |
|----|-------------|----------|
| WH-01 | Hệ thống nhận HTTP POST request tại `/api/incoming-webhooks/{slug}` | Must Have |
| WH-02 | Hệ thống tìm endpoint tương ứng theo slug | Must Have |
| WH-03 | Hệ thống trả 404 nếu không tìm thấy endpoint | Must Have |
| WH-04 | Hệ thống trả 403 nếu endpoint bị inactive | Must Have |
| WH-05 | Hệ thống đọc và lưu raw request body (payload JSON) | Must Have |
| WH-06 | Hệ thống đọc và lưu toàn bộ request headers | Must Have |
| WH-07 | Hệ thống lưu source IP của request | Must Have |
| WH-08 | Hệ thống extract event type từ header | Must Have |
| WH-09 | Hệ thống kiểm tra event type có trong allowed list không | Should Have |
| WH-10 | Hệ thống lưu event với status `Pending` | Must Have |
| WH-11 | Hệ thống trả `200 OK` hoặc `202 Accepted` nhanh nhất có thể | Must Have |
| WH-12 | Hệ thống kiểm tra `ExternalEventId` để chống duplicate | Should Have |
| WH-13 | Event trùng được đánh dấu `Duplicate` thay vì xử lý lại | Should Have |
| WH-14 | Nếu signature verification bật: verify trước khi lưu | Should Have |
| WH-15 | Request với signature sai bị đánh dấu `InvalidSignature` | Should Have |

---

### 1.5 Signature Verification

| ID | Requirement | Priority |
|----|-------------|----------|
| SIG-01 | Hệ thống hỗ trợ HMAC SHA256 signature verification | Should Have |
| SIG-02 | Secret key được lưu dưới dạng hash/encrypted (không lưu plaintext) | Must Have |
| SIG-03 | Signature nằm trong header `X-Webhook-Signature` format `sha256=xxx` | Should Have |
| SIG-04 | Hệ thống tính HMAC từ raw body + secret và so sánh với header | Should Have |
| SIG-05 | Nếu signature hợp lệ: `SignatureValid = true` | Should Have |
| SIG-06 | Nếu signature không hợp lệ: `Status = InvalidSignature` | Should Have |
| SIG-07 | User có thể rotate secret key bất kỳ lúc nào | Should Have |
| SIG-08 | Simulator hỗ trợ gửi với valid, invalid, hoặc không có signature | Should Have |

---

### 1.6 Background Event Processing (Worker)

| ID | Requirement | Priority |
|----|-------------|----------|
| WK-01 | Worker service chạy độc lập với API service | Should Have |
| WK-02 | Worker poll event có status `Pending` theo interval | Should Have |
| WK-03 | Worker cập nhật event sang `Processing` trước khi xử lý | Should Have |
| WK-04 | Worker tạo bản ghi `ProcessingAttempt` cho mỗi lần xử lý | Should Have |
| WK-05 | Sau xử lý thành công: `Status = Processed`, ghi `ProcessedAt` | Should Have |
| WK-06 | Sau xử lý thất bại: `Status = Failed`, ghi `ErrorMessage` | Should Have |
| WK-07 | Worker ghi `DurationMs` cho mỗi attempt | Should Have |
| WK-08 | Worker xử lý concurrent (nhiều event cùng lúc) | Nice to Have |

---

### 1.7 Retry & Replay

| ID | Requirement | Priority |
|----|-------------|----------|
| RT-01 | Event lỗi được chuyển sang `Retrying` và tự retry | Should Have |
| RT-02 | Retry strategy: exponential backoff 1m → 5m → 15m → 1h | Should Have |
| RT-03 | Sau khi vượt `MaxRetryAttempts`: `Status = Dead` | Should Have |
| RT-04 | User có thể xem danh sách event đang `Retrying` hoặc `Dead` | Should Have |
| RT-05 | User có thể Replay một event (reset về `Pending`) | Should Have |
| RT-06 | User có thể Ignore một event (đánh dấu `Ignored`) | Should Have |
| RT-07 | `NextRetryAt` được tính và hiển thị cho user | Should Have |
| RT-08 | Mỗi lần retry tăng `RetryCount` lên 1 | Should Have |

---

### 1.8 Event Logs & Monitoring

| ID | Requirement | Priority |
|----|-------------|----------|
| LOG-01 | User xem được danh sách tất cả webhook event | Must Have |
| LOG-02 | Danh sách hỗ trợ pagination | Must Have |
| LOG-03 | Lọc event theo: status, event type, endpoint, date range | Must Have |
| LOG-04 | Tìm kiếm event theo event ID hoặc payload content | Should Have |
| LOG-05 | User xem chi tiết một event: payload, headers, metadata | Must Have |
| LOG-06 | Payload JSON được hiển thị với syntax highlighting | Must Have |
| LOG-07 | User xem được processing attempts của event | Should Have |
| LOG-08 | User xem được processing timeline | Should Have |
| LOG-09 | User xem được error message của từng attempt | Should Have |

---

### 1.9 Dashboard & Analytics

| ID | Requirement | Priority |
|----|-------------|----------|
| DASH-01 | Dashboard hiển thị tổng số event | Must Have |
| DASH-02 | Dashboard hiển thị: Processed, Failed, Retrying, Dead count | Must Have |
| DASH-03 | Dashboard hiển thị failure rate | Should Have |
| DASH-04 | Dashboard hiển thị average processing time | Should Have |
| DASH-05 | Biểu đồ event theo thời gian (line chart) | Should Have |
| DASH-06 | Biểu đồ phân bố status (donut chart) | Should Have |
| DASH-07 | Danh sách recent events | Must Have |
| DASH-08 | Dashboard có thể filter theo project | Should Have |

---

### 1.10 Webhook Simulator

| ID | Requirement | Priority |
|----|-------------|----------|
| SIM-01 | User có thể chọn project và endpoint để test | Must Have |
| SIM-02 | User có thể nhập event type tùy chỉnh | Must Have |
| SIM-03 | User có thể nhập payload JSON tùy chỉnh | Must Have |
| SIM-04 | Hệ thống gửi POST trực tiếp đến endpoint URL | Must Have |
| SIM-05 | Kết quả gửi được hiển thị ngay (status, response) | Must Have |
| SIM-06 | Có preview cURL command để copy | Must Have |
| SIM-07 | Có link mở Event Detail sau khi gửi thành công | Should Have |
| SIM-08 | User có thể chọn signature mode: None / Valid / Invalid | Should Have |
| SIM-09 | User có thể thêm custom headers | Nice to Have |

---

## 2. Non-Functional Requirements (Yêu cầu phi chức năng)

### 2.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| PERF-01 | Incoming webhook API trả response trong vòng | < 300ms |
| PERF-02 | Dashboard API response time | < 500ms |
| PERF-03 | Worker poll interval | 5 giây |
| PERF-04 | Worker xử lý concurrent events | 5 events/cycle |
| PERF-05 | Event list API hỗ trợ pagination | 20-50 items/page |

---

### 2.2 Reliability

| ID | Requirement |
|----|-------------|
| REL-01 | Event không bao giờ bị mất sau khi đã được lưu vào database |
| REL-02 | Worker có khả năng tự phục hồi sau crash (idempotent processing) |
| REL-03 | Health check endpoint để monitoring service status |
| REL-04 | Database connection với retry logic |
| REL-05 | Graceful shutdown cho worker (không bỏ giữa chừng event đang xử lý) |

---

### 2.3 Scalability

| ID | Requirement |
|----|-------------|
| SCAL-01 | API service và Worker service tách biệt, có thể scale độc lập |
| SCAL-02 | Database connection pooling |
| SCAL-03 | Stateless API để có thể chạy nhiều instance |

---

### 2.4 Maintainability

| ID | Requirement |
|----|-------------|
| MAINT-01 | Codebase theo Clean Architecture (Api/Application/Domain/Infrastructure) |
| MAINT-02 | Có unit test cho business logic |
| MAINT-03 | Structured logging bằng Serilog |
| MAINT-04 | API documentation tự động bằng Swagger/Scalar |
| MAINT-05 | Mỗi module có trách nhiệm rõ ràng (SRP) |

---

### 2.5 Usability

| ID | Requirement |
|----|-------------|
| UX-01 | Giao diện responsive, hoạt động tốt trên desktop và tablet |
| UX-02 | Webhook URL có nút Copy to Clipboard |
| UX-03 | JSON payload được format và highlight syntax |
| UX-04 | Error message rõ ràng, dễ hiểu |
| UX-05 | Loading state hiển thị khi đang fetch data |
| UX-06 | Toast notification khi thao tác thành công/thất bại |

---

### 2.6 Deployment

| ID | Requirement |
|----|-------------|
| DEP-01 | Toàn bộ stack chạy được bằng `docker compose up` |
| DEP-02 | Environment configuration qua `.env` file |
| DEP-03 | Database migration chạy tự động hoặc có lệnh rõ ràng |
| DEP-04 | CI pipeline kiểm tra build trước khi merge |
| DEP-05 | CD pipeline tự động deploy khi merge vào `main` |

---

## 3. Security Requirements (Yêu cầu bảo mật)

### 3.1 Authentication & Authorization

| ID | Requirement |
|----|-------------|
| SEC-01 | Password phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số |
| SEC-02 | Password được hash bằng BCrypt (cost factor ≥ 12) |
| SEC-03 | JWT access token có thời hạn ngắn (60 phút) |
| SEC-04 | Refresh token có thời hạn dài hơn (7 ngày) |
| SEC-05 | API protected đều yêu cầu Bearer token hợp lệ |
| SEC-06 | User không thể truy cập resource của user khác |
| SEC-07 | JWT secret phải được cấu hình qua environment variable |

---

### 3.2 Webhook Security

| ID | Requirement |
|----|-------------|
| SEC-08 | Secret key của endpoint không được lưu dưới dạng plaintext |
| SEC-09 | HMAC SHA256 được dùng để verify webhook signature |
| SEC-10 | Constant-time comparison khi so sánh signature (chống timing attack) |
| SEC-11 | Request với signature không hợp lệ bị từ chối và ghi log |
| SEC-12 | Secret key mới được sinh ngẫu nhiên đủ entropy (≥ 256 bits) |

---

### 3.3 API Security

| ID | Requirement |
|----|-------------|
| SEC-13 | CORS được cấu hình chỉ cho phép origin hợp lệ |
| SEC-14 | Rate limiting cho incoming webhook API (chống DDoS) |
| SEC-15 | Input validation cho tất cả request body |
| SEC-16 | SQL injection được ngăn chặn qua parameterized queries (EF Core) |
| SEC-17 | Sensitive data (password, secret) không được log |
| SEC-18 | HTTPS bắt buộc trong production |

---

### 3.4 Infrastructure Security

| ID | Requirement |
|----|-------------|
| SEC-19 | Database password không được hardcode trong source code |
| SEC-20 | Tất cả secret được quản lý qua environment variables |
| SEC-21 | Docker containers không chạy với quyền root |
| SEC-22 | `.env` file phải nằm trong `.gitignore` |

---

## 4. Constraints & Assumptions

### Constraints (Ràng buộc)
- **Backend:** ASP.NET Core 8 (.NET 8)
- **Frontend:** React 18 + Vite + TypeScript
- **Database:** PostgreSQL 16
- **Cache/Queue:** Redis 7
- **Container:** Docker + Docker Compose
- **CI/CD:** GitHub Actions

### Assumptions (Giả định)
- Người dùng là developer, có kiến thức kỹ thuật cơ bản
- Webhook payload luôn là JSON
- Hệ thống ban đầu là single-tenant (mỗi user quản lý data riêng)
- Không cần realtime push notification (polling là đủ cho MVP)
- Provider signature format theo chuẩn: `sha256=<hex_signature>`

---

*Tài liệu này thuộc về dự án HookFlow — Webhook Event Processor*
*Phiên bản tài liệu: 1.0 | Cập nhật: 2026*

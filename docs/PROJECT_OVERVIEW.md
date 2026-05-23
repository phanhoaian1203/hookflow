# HookFlow — Project Overview

> **Webhook Event Processor** — Nền tảng tiếp nhận, xác thực, lưu trữ và giám sát toàn bộ vòng đời webhook event.

---

## 1. HookFlow là gì?

**HookFlow** là một developer tool cho phép backend developer và team kỹ thuật quản lý toàn bộ vòng đời (lifecycle) của webhook event một cách chuyên nghiệp, an toàn và có thể quan sát được (observable).

Thay vì phải tự tay xây dựng hệ thống tiếp nhận webhook từ đầu mỗi khi tích hợp (GitHub, payment gateway, CI/CD, internal service…), HookFlow cung cấp một platform hoàn chỉnh gồm:

- **Webhook Endpoint Manager** — tạo và quản lý các URL nhận webhook
- **Incoming Webhook Receiver** — tiếp nhận, xác thực và lưu trữ event
- **Background Event Processor** — xử lý event bất đồng bộ qua worker
- **Retry Engine** — tự động thử lại khi xử lý thất bại
- **Monitoring Dashboard** — giám sát realtime toàn bộ luồng xử lý
- **Webhook Simulator** — công cụ test webhook ngay trong giao diện

**Nói ngắn gọn:**
> HookFlow = Postman (test) + Sentry (monitoring) + Queue Monitor (retry/dead letter) — tập trung hoàn toàn cho webhook lifecycle.

---

## 2. Dự án giải quyết vấn đề gì?

Webhook từ các hệ thống bên ngoài mang lại nhiều thách thức thực tế mà một webhook endpoint đơn giản không thể giải quyết:

### Vấn đề 1: Event có thể bị mất
Nếu server crash, database timeout, hay worker fail trong lúc xử lý, event sẽ mất hoàn toàn vì không có nơi lưu trữ.

**Giải pháp:** HookFlow lưu raw payload vào database **ngay lập tức** khi nhận được request, trước khi xử lý bất cứ điều gì.

### Vấn đề 2: Webhook có thể bị gửi trùng
Provider thường retry nếu không nhận được response đúng hạn. Hệ thống nhận nhiều bản sao của cùng một event có thể gây: cập nhật đơn hàng nhiều lần, gửi email nhiều lần, cộng điểm nhiều lần.

**Giải pháp:** Idempotency check qua `ExternalEventId`. Cùng một event dù gửi nhiều lần, hệ thống chỉ xử lý một lần duy nhất.

### Vấn đề 3: Webhook có thể bị giả mạo
URL nhận webhook thường là public. Kẻ xấu có thể gửi request giả để kích hoạt logic nghiệp vụ.

**Giải pháp:** HMAC SHA256 Signature Verification. Mỗi endpoint có secret key riêng. Backend tính lại signature từ raw body và so sánh với signature trong header.

### Vấn đề 4: Xử lý có thể lỗi tạm thời
Email service down, database timeout, external API không phản hồi — các lỗi tạm thời sẽ làm event bị bỏ mất nếu không có cơ chế retry.

**Giải pháp:** Retry engine với exponential backoff: 1 phút → 5 phút → 15 phút → 1 giờ → Dead Letter Queue.

### Vấn đề 5: Khó debug khi tích hợp
Developer cần biết: webhook đã đến chưa? Payload là gì? Headers gì? Lỗi ở đâu? Retry mấy lần? Nếu không có dashboard, debug rất tốn thời gian.

**Giải pháp:** Dashboard với JSON payload viewer, headers viewer, processing timeline, attempt history, error message chi tiết.

### Vấn đề 6: Xử lý quá lâu trong request
Nếu xử lý phức tạp (gọi API khác, gửi email, cập nhật DB…) ngay trong request nhận webhook, provider sẽ timeout và gửi lại.

**Giải pháp:** Background Worker tách biệt. API chỉ verify + lưu + trả `200 OK` nhanh. Worker xử lý sau.

---

## 3. Ai là người dùng?

HookFlow là **developer tool**, không phải consumer app. Người dùng chính:

| Vai trò | Nhu cầu |
|---------|---------|
| **Backend Developer** | Tích hợp webhook từ GitHub, payment, CI/CD nhanh chóng |
| **Fullstack Developer** | Muốn có dashboard để theo dõi và debug webhook |
| **DevOps / Platform Engineer** | Giám sát health của các integration webhook |
| **Technical Lead / Startup CTO** | Quản lý nhiều webhook từ nhiều provider trên một platform |
| **QA Engineer** | Dùng Simulator để test webhook mà không cần provider thật |

**Đặc điểm người dùng:**
- Hiểu HTTP, REST API, JSON
- Đã từng tích hợp ít nhất một webhook (GitHub, Stripe, PayPal…)
- Cần giải pháp nhanh, không muốn tự build từ đầu
- Cần khả năng debug và theo dõi

---

## 4. Use case chính

### Use Case 1: Nhận webhook từ GitHub
**Kịch bản:** Team muốn ghi nhận mỗi lần có người push code lên repo.

```
Developer đăng nhập HookFlow
→ Tạo Project: "GitHub Monitor"
→ Tạo Endpoint: "Push Events" (Provider: GitHub)
→ Copy webhook URL
→ Paste URL vào GitHub Repository Settings → Webhooks
→ GitHub gửi event mỗi khi có push
→ HookFlow lưu và hiển thị toàn bộ event trên dashboard
```

**Event nhận được:**
```json
{
  "ref": "refs/heads/main",
  "repository": { "name": "my-project" },
  "pusher": { "name": "developer" },
  "commits": [{ "message": "feat: add authentication" }]
}
```

---

### Use Case 2: Xử lý webhook thanh toán
**Kịch bản:** App bán hàng nhận thông báo thanh toán thành công từ cổng thanh toán.

```
Cổng thanh toán gửi POST /api/incoming-webhooks/payment-success
→ HookFlow verify signature
→ Lưu event với status Pending
→ Worker xử lý: cập nhật đơn hàng, gửi email xác nhận
→ Nếu email service lỗi → Retry sau 1 phút
→ Admin xem log và có thể Replay nếu cần
```

**Event nhận được:**
```json
{
  "event": "payment.success",
  "orderId": "ORD-2026-001",
  "amount": 350000,
  "currency": "VND",
  "transactionId": "TXN-88421"
}
```

---

### Use Case 3: Monitor CI/CD deployment
**Kịch bản:** Hệ thống deploy gửi event khi deployment hoàn tất.

```
GitHub Actions gửi webhook sau mỗi deployment
→ HookFlow ghi nhận: service nào, version nào, môi trường nào, ai deploy
→ Dashboard hiển thị lịch sử deployment
→ Team biết ngay deployment thành công hay thất bại
```

---

### Use Case 4: Debug và Replay
**Kịch bản:** Event xử lý lỗi do database timeout, cần xử lý lại.

```
Worker xử lý event → database timeout → Status = Failed
→ Retry tự động 4 lần với exponential backoff
→ Vẫn lỗi → Status = Dead
→ Admin vào Retry Queue
→ Đọc error message, fix vấn đề
→ Bấm Replay → Event quay về Pending → Worker xử lý lại
```

---

### Use Case 5: Test webhook bằng Simulator
**Kịch bản:** Developer muốn test endpoint mà không cần provider thật.

```
Developer vào Webhook Simulator
→ Chọn Project + Endpoint
→ Nhập event type và payload JSON
→ Chọn signature mode (Valid / Invalid / None)
→ Bấm Send Test Webhook
→ Xem kết quả ngay: status, signature validation, event detail
→ Copy cURL command để test ngoài terminal
```

---

## 5. Tính năng nổi bật

| Tính năng | Mô tả |
|-----------|-------|
| 🔐 **Signature Verification** | HMAC SHA256, reject invalid request |
| 🔁 **Idempotency** | Không xử lý trùng cùng một event |
| ⚙️ **Background Worker** | Tách xử lý khỏi request, response nhanh |
| 🔄 **Retry Engine** | Exponential backoff, Dead Letter Queue |
| 🔂 **Manual Replay** | Admin replay event thủ công |
| 📊 **Analytics Dashboard** | Metrics, charts, recent events |
| 🧪 **Webhook Simulator** | Test endpoint không cần provider thật |
| 🔍 **Event Debug View** | JSON viewer, headers, timeline, attempts |
| 🗂️ **Project Management** | Gom nhóm endpoint theo project |
| 🐳 **Docker Ready** | Chạy toàn bộ stack bằng `docker compose up` |
| 🚀 **CI/CD** | GitHub Actions build, test, deploy |

---

## 6. Giá trị kỹ thuật của dự án

Dự án này vượt xa một CRUD app thông thường vì nó chứng minh khả năng:

- **Backend thực tế**: Raw body handling, HMAC crypto, idempotency pattern
- **Distributed systems**: API service và Worker service tách biệt
- **Reliability engineering**: Retry, Dead Letter, Circuit Breaker concept
- **Observability**: Dashboard, logging, event tracing
- **DevOps**: Docker multi-service, GitHub Actions CI/CD
- **Security**: JWT auth, HMAC signature, secret key management

---

*Tài liệu này thuộc về dự án HookFlow — Webhook Event Processor*
*Phiên bản tài liệu: 1.0 | Cập nhật: 2026*

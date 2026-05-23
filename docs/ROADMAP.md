# HookFlow — Roadmap

> Lộ trình phát triển chi tiết dự án HookFlow Webhook Event Processor.
> Tổng cộng 17 version, chia thành 3 mốc lớn và 8 tuần phát triển.

---

## 🎯 3 Mốc Lớn

| Mốc | Mục tiêu | Version |
|-----|----------|---------|
| **Mốc 1** | MVP chạy local: Tạo endpoint → Gửi webhook → Xem event logs | v0.1 → v0.9 |
| **Mốc 2** | Production-like local: `docker compose up` chạy toàn bộ | v1.0-alpha |
| **Mốc 3** | Portfolio-ready: CI/CD, deploy, README, demo | v1.1 → v1.7 |

---

## Tổng quan tất cả versions

| Version | Tên giai đoạn | Mục tiêu chính | Tuần |
|---------|--------------|----------------|------|
| v0.1 | Planning & Project Setup | Repo, cấu trúc, docs | Ngày 1 |
| v0.2 | UI Foundation | React app, layout, mock pages | Ngày 2 |
| v0.3 | Backend Foundation | .NET solution, DB, migration | Ngày 3 |
| v0.4 | Authentication MVP | Register, Login, JWT, protected route | Ngày 4-5 |
| v0.5 | Project Management | User tạo/quản lý project | Ngày 6-7 |
| v0.6 | Webhook Endpoint Management | Tạo endpoint với slug + secret | Tuần 2 |
| v0.7 | Incoming Webhook MVP | Nhận webhook, lưu event | Tuần 2 |
| v0.8 | Event Logs & Event Detail | Dashboard event logs | Tuần 3 |
| v0.9 | Webhook Simulator | Test webhook từ UI | Tuần 3 |
| v1.0-alpha | Docker Local | Dockerize full MVP | Tuần 4 |
| v1.1 | Signature Verification | HMAC SHA256 bảo mật | Tuần 5 |
| v1.2 | Worker Processing | Background worker tách riêng | Tuần 5 |
| v1.3 | Retry & Replay | Retry engine, dead letter, replay | Tuần 6 |
| v1.4 | Dashboard Analytics | Metrics, charts thống kê | Tuần 6 |
| v1.5 | CI Pipeline | GitHub Actions build/test | Tuần 7 |
| v1.6 | CD & Deployment | Deploy lên VPS | Tuần 7 |
| v1.7 | Portfolio Polish | README, docs, demo video | Tuần 8 |

---

## 📋 v0.1 — Planning & Project Setup
**Ngày 1 | Tuần 1**

### Mục tiêu
Giai đoạn này giúp hiểu dự án và chuẩn bị nền móng. Chưa cần code nhiều.

### Checklist
- [x] Tạo GitHub repository `hookflow`
- [x] Tạo cấu trúc thư mục ban đầu (`backend/`, `frontend/`, `docs/`, `.github/workflows/`)
- [x] Tạo `README.md` cơ bản
- [x] Tạo `docs/PROJECT_OVERVIEW.md`
- [x] Tạo `docs/REQUIREMENTS.md`
- [x] Tạo `docs/ARCHITECTURE.md`
- [x] Tạo `docs/DATABASE_DESIGN.md`
- [x] Tạo `docs/API_DESIGN.md`
- [x] Tạo `docs/ROADMAP.md`
- [x] Tạo `.gitignore` đầy đủ
- [x] Tạo `docker-compose.yml` skeleton

### Kết quả đầu ra
- Repo GitHub đã tạo với cấu trúc thư mục chuẩn
- 6 file docs đã có nội dung
- Commit đầu tiên

**Commit message:** `chore: initialize project structure and documentation`

---

## 🎨 v0.2 — UI Foundation
**Ngày 2 | Tuần 1**

### Mục tiêu
Setup frontend React và làm các page mock để định hình giao diện sản phẩm. **Chưa cần backend.**

### Việc cần làm

#### Setup
- [ ] Tạo Vite React TypeScript app trong `frontend/`
  ```bash
  npm create vite@latest . -- --template react-ts
  ```
- [ ] Cài thư viện: `react-router-dom`, `axios`, `@tanstack/react-query`, `react-hook-form`, `zod`
- [ ] Setup Tailwind CSS v3
- [ ] Tạo cấu trúc thư mục: `components/`, `features/`, `pages/`, `routes/`, `services/`, `types/`, `hooks/`, `lib/`

#### Routes (mock, chưa cần backend)
- [ ] Route `/` → Landing Page
- [ ] Route `/login` → Login Page
- [ ] Route `/register` → Register Page
- [ ] Route `/dashboard` → Dashboard (protected)
- [ ] Route `/projects` → Projects Page
- [ ] Route `/endpoints` → Endpoints Page
- [ ] Route `/events` → Event Logs Page
- [ ] Route `/simulator` → Simulator Page
- [ ] Route `/settings` → Settings Page

#### Pages (mock data)
- [ ] **Landing Page**: Header, Hero section, Feature cards, How it works, CTA
- [ ] **Login Page**: Form email + password, link to register
- [ ] **Register Page**: Form fullName + email + password
- [ ] **Dashboard Layout**: Sidebar, Header, main content area
- [ ] **Dashboard Page** (mock data): Metric cards, recent events table
- [ ] **Event Logs Page** (mock): Table với status badges
- [ ] **Event Detail Page** (mock): JSON viewer, timeline
- [ ] **Simulator Page** (mock): Form gửi webhook

#### Mock Data
```ts
const mockEvents = [
  { id: "evt_001", eventType: "payment.success", status: "Processed", retryCount: 0 },
  { id: "evt_002", eventType: "github.push", status: "Failed", retryCount: 2 },
  { id: "evt_003", eventType: "deployment.finished", status: "Retrying", retryCount: 1 },
];
```

### Kết quả đầu ra
- React app chạy được tại `http://localhost:5173`
- Routing cơ bản hoạt động
- Giao diện định hình được sản phẩm

**Commit message:** `feat(frontend): setup React app and initial UI pages`

---

## ⚙️ v0.3 — Backend Foundation
**Ngày 3 | Tuần 1**

### Mục tiêu
Dựng backend .NET với kiến trúc rõ ràng, kết nối database thành công.

### Việc cần làm

#### .NET Solution Structure
```
backend/
├── HookFlow.sln
├── HookFlow.Api/
├── HookFlow.Application/
├── HookFlow.Domain/
├── HookFlow.Infrastructure/
└── HookFlow.Tests/
```

- [ ] Tạo solution và 5 project
- [ ] Setup project references: Api → Application → Domain, Infrastructure → Application
- [ ] Cài packages: EF Core, Npgsql, JWT Bearer, FluentValidation, Serilog, Swagger

#### Domain Entities
- [ ] `User.cs`
- [ ] `Project.cs`
- [ ] `WebhookEndpoint.cs`
- [ ] `WebhookEvent.cs`
- [ ] `ProcessingAttempt.cs`
- [ ] Enums: `WebhookEventStatus`, `WebhookProvider`, `RetryStrategy`

#### Infrastructure
- [ ] `HookFlowDbContext.cs` với đủ 5 DbSets
- [ ] EF Core configuration (Fluent API) cho từng entity
- [ ] PostgreSQL connection string trong `appsettings.json`

#### Migration
- [ ] `dotnet ef migrations add InitialCreate`
- [ ] `dotnet ef database update`

#### API Setup
- [ ] Swagger/Scalar documentation
- [ ] Global exception handling middleware
- [ ] Serilog structured logging
- [ ] `GET /api/health` endpoint

### Kết quả đầu ra
- API chạy được tại `http://localhost:5000`
- Swagger mở được tại `http://localhost:5000/swagger`
- PostgreSQL kết nối thành công
- Migration chạy tạo đủ các bảng

**Commit message:** `feat(backend): setup .NET solution and database foundation`

---

## 🔐 v0.4 — Authentication MVP
**Ngày 4-5 | Tuần 1**

### Mục tiêu
User có thể đăng ký, đăng nhập, nhận JWT token. Frontend login xong vào được dashboard.

### Backend
- [ ] `POST /api/auth/register` — validate, hash password, tạo user
- [ ] `POST /api/auth/login` — verify password, generate JWT
- [ ] `GET /api/auth/me` — trả thông tin user hiện tại (protected)
- [ ] JWT Bearer middleware configuration
- [ ] FluentValidation cho register và login request

### Frontend
- [ ] Login page gọi API thật (`POST /api/auth/login`)
- [ ] Register page gọi API thật (`POST /api/auth/register`)
- [ ] Lưu JWT token (memory + localStorage)
- [ ] `AuthContext` + `AuthProvider`
- [ ] `ProtectedRoute` component
- [ ] Redirect về `/login` nếu chưa đăng nhập
- [ ] Axios interceptor tự động gắn Bearer token
- [ ] Logout button xóa token

### Kết quả đầu ra
- User đăng ký và đăng nhập được
- Token được lưu và gửi kèm mỗi request
- Protected routes hoạt động đúng

**Commit message:** `feat(auth): implement JWT authentication flow`

---

## 📁 v0.5 — Project Management
**Ngày 6-7 | Tuần 1**

### Mục tiêu
Sau khi login, user có thể tạo và quản lý project.

### Backend
- [ ] `GET /api/projects` — danh sách project của user
- [ ] `POST /api/projects` — tạo project mới
- [ ] `GET /api/projects/{id}` — chi tiết project
- [ ] `PUT /api/projects/{id}` — cập nhật project
- [ ] `DELETE /api/projects/{id}` — xóa project
- [ ] Authorization: chỉ owner mới xem/sửa được project của mình

### Frontend
- [ ] Projects Page — danh sách projects
- [ ] Create Project Modal — form tạo project
- [ ] Edit Project — inline edit hoặc modal
- [ ] Delete Project — confirmation dialog
- [ ] Project Detail Page — thông tin project + endpoint list

### Kết quả đầu ra
- User tạo/xem/sửa/xóa được project
- Data thật từ API, không còn mock

**Commit message:** `feat(projects): implement project management`

---

## 🔗 v0.6 — Webhook Endpoint Management
**Tuần 2**

### Mục tiêu
User tạo webhook endpoint với URL và secret key riêng.

### Backend
- [ ] `GET /api/webhook-endpoints` — danh sách endpoint
- [ ] `POST /api/webhook-endpoints` — tạo endpoint (sinh slug + secret key)
- [ ] `GET /api/webhook-endpoints/{id}` — chi tiết endpoint
- [ ] `PUT /api/webhook-endpoints/{id}` — cập nhật
- [ ] `PATCH /api/webhook-endpoints/{id}/toggle` — bật/tắt
- [ ] `POST /api/webhook-endpoints/{id}/rotate-secret` — tạo lại secret
- [ ] Logic sinh slug từ name (auto, unique)
- [ ] Logic sinh secret key (random, đủ entropy)

### Frontend
- [ ] Endpoints Page — danh sách endpoint
- [ ] Create Endpoint Form/Modal
- [ ] Endpoint Detail Page với Copy URL button
- [ ] Toggle Active/Inactive
- [ ] Rotate Secret button + confirmation

### Kết quả đầu ra
- User tạo được endpoint với URL riêng
- URL có thể copy để dán vào provider

**Commit message:** `feat(endpoints): implement webhook endpoint management`

---

## 🎯 v0.7 — Incoming Webhook MVP *(Trái tim dự án)*
**Tuần 2**

### Mục tiêu
External service gửi webhook → hệ thống lưu event. **Core feature!**

### Backend
- [ ] `POST /api/incoming-webhooks/{slug}` — public endpoint
- [ ] Đọc raw body (middleware `EnableBuffering`)
- [ ] Đọc toàn bộ headers
- [ ] Tìm endpoint theo slug → 404/403
- [ ] Extract event type từ header
- [ ] Lưu `WebhookEvent` với `Status = Pending`
- [ ] Trả `200 OK` nhanh nhất có thể

### Test
- [ ] Test bằng `curl`:
  ```bash
  curl -X POST http://localhost:5000/api/incoming-webhooks/payment-success \
    -H "Content-Type: application/json" \
    -H "X-Webhook-Event: payment.success" \
    -d '{"event":"payment.success","orderId":"ORD001","amount":350000}'
  ```
- [ ] Kiểm tra event xuất hiện trong database

### Kết quả đầu ra
- `curl` thành công, nhận `200 OK`
- Event được lưu vào DB với payload và headers đúng

**Commit message:** `feat(webhooks): implement incoming webhook receiver`

---

## 📊 v0.8 — Event Logs & Event Detail
**Tuần 3**

### Mục tiêu
Giao diện xem log webhook event — biến app thành sản phẩm thật.

### Backend
- [ ] `GET /api/webhook-events` — danh sách với 9 filter params
- [ ] `GET /api/webhook-events/{id}` — chi tiết đầy đủ

### Frontend
- [ ] **Event Logs Page**: table với columns: EventType, Endpoint, Status, Received At, Retry Count
- [ ] Filter bar: Status, Event Type, Endpoint, Date Range, Search
- [ ] Pagination
- [ ] Status badges với màu sắc theo status
- [ ] **Event Detail Page**: payload JSON viewer, headers viewer, metadata
- [ ] JSON syntax highlighting (Monaco Editor hoặc custom)
- [ ] Link quay lại Event Logs

### Kết quả đầu ra
- User xem được danh sách events từ API thật
- Click vào event → xem payload JSON đẹp

**Commit message:** `feat(events): implement event logs and event detail`

---

## 🧪 v0.9 — Webhook Simulator
**Tuần 3**

### Mục tiêu
Trang test webhook ngay trong UI — critical cho demo!

### Frontend
- [ ] Simulator Page tại `/simulator`
- [ ] Project selector (dropdown)
- [ ] Endpoint selector (filter theo project)
- [ ] Event type input
- [ ] JSON payload editor (textarea với auto-format)
- [ ] Send button → gọi trực tiếp `POST /api/incoming-webhooks/{slug}`
- [ ] Hiển thị kết quả: status, response, event ID
- [ ] Link mở Event Detail
- [ ] cURL preview để copy ra terminal

### Kết quả đầu ra
- Gửi webhook test không cần GitHub/Stripe thật
- Event xuất hiện ngay trong Event Logs
- Có thể demo trọn flow trong 30 giây

**Commit message:** `feat(simulator): add webhook simulator page`

> 🎉 **Mốc 1 hoàn thành!** MVP core chạy local: Tạo endpoint → Gửi webhook → Xem log.

---

## 🐳 v1.0-alpha — Docker Local
**Tuần 4**

### Mục tiêu
Chạy toàn bộ app bằng một lệnh duy nhất.

### Tại sao Docker ở đây?
- App đã có luồng core rõ ràng
- Database schema tương đối ổn định
- Sẽ không phải sửa Docker config nhiều nữa

### Việc cần làm
- [ ] `backend/HookFlow.Api/Dockerfile` — multi-stage build
- [ ] `frontend/Dockerfile` — build static + serve bằng nginx
- [ ] Cập nhật `docker-compose.yml` với 3 services: `postgres`, `backend-api`, `frontend`
- [ ] Health check cho các service
- [ ] Environment variables configuration
- [ ] Test `docker compose up -d` thành công
- [ ] Test webhook simulator vẫn hoạt động trong Docker

### Kết quả đầu ra
```bash
docker compose up -d
# Frontend: http://localhost:5173
# Backend:  http://localhost:5000
# Database: localhost:5432
```

**Commit message:** `chore(docker): add Docker setup for MVP services`

> 🎉 **Mốc 2 hoàn thành!** Docker local chạy được.

---

## 🔒 v1.1 — Signature Verification
**Tuần 5**

### Mục tiêu
Bảo mật webhook với HMAC SHA256.

### Backend
- [ ] Interface `IWebhookSignatureVerifier`
- [ ] Implementation `HmacSha256SignatureVerifier`
- [ ] Constant-time comparison (chống timing attack)
- [ ] Tích hợp vào Incoming Webhook receiver
- [ ] Lưu `SignatureValid` vào event
- [ ] Set `Status = InvalidSignature` khi sai

### Frontend
- [ ] Endpoint settings: toggle signature verification, custom header name
- [ ] Event Logs: hiển thị signature badge (Valid/Invalid/Not Checked)
- [ ] Simulator: chọn signature mode (None / Valid / Invalid)
- [ ] Endpoint Detail: hiển thị secret status

### Kết quả đầu ra
- Webhook với signature đúng: `SignatureValid = true`
- Webhook với signature sai: `Status = InvalidSignature`
- Simulator test được cả 3 mode

**Commit message:** `feat(security): add HMAC signature verification`

---

## ⚙️ v1.2 — Worker Processing
**Tuần 5**

### Mục tiêu
Tách xử lý event ra khỏi API — pattern quan trọng trong backend thực tế.

### Backend
- [ ] Project mới: `HookFlow.Worker`
- [ ] `EventProcessingWorker` — poll events mỗi 5 giây
- [ ] Logic: Pending → Processing → tạo ProcessingAttempt → Processed/Failed
- [ ] Ghi `DurationMs` cho mỗi attempt
- [ ] `Dockerfile.worker` — Dockerfile cho worker
- [ ] Thêm service `webhook-worker` vào `docker-compose.yml`

### Frontend
- [ ] Event Detail: hiển thị Processing Attempts list
- [ ] Hiển thị AttemptNumber, Status, Duration, Error

### Kết quả đầu ra
- Worker tự chuyển `Pending → Processing → Processed`
- Event Detail có timeline xử lý

**Commit message:** `feat(worker): add background event processing`

---

## 🔄 v1.3 — Retry & Replay
**Tuần 6**

### Mục tiêu
Event lỗi được retry tự động và có thể replay thủ công.

### Backend
- [ ] Retry scheduler trong Worker: check `Retrying` events với `NextRetryAt <= now()`
- [ ] Exponential backoff: 1m → 5m → 15m → 1h
- [ ] Tính `NextRetryAt` sau mỗi lần thất bại
- [ ] Khi vượt `MaxRetryAttempts`: `Status = Dead`
- [ ] `POST /api/webhook-events/{id}/replay` — reset về Pending
- [ ] `POST /api/webhook-events/{id}/ignore` — đánh dấu Ignored
- [ ] `GET /api/webhook-events/retry-queue` — danh sách Retrying + Dead

### Frontend
- [ ] **Retry Queue Page** tại `/retry-queue`
- [ ] Scheduled retries section
- [ ] Dead letter events section
- [ ] Replay button (với confirmation)
- [ ] Ignore button
- [ ] Hiển thị: Next Retry At, Retry Count, Last Error
- [ ] Event Detail: Replay button, retry timeline

### Kết quả đầu ra
- Event lỗi tự retry đúng schedule
- Dead events có thể replay thủ công
- Retry Queue page đầy đủ

**Commit message:** `feat(retry): implement retry and replay workflow`

---

## 📈 v1.4 — Dashboard Analytics
**Tuần 6**

### Mục tiêu
Dashboard tổng quan chuyên nghiệp với metrics và charts.

### Backend
- [ ] `GET /api/dashboard/summary` — metrics tổng quan
- [ ] `GET /api/dashboard/events-over-time` — dữ liệu line chart
- [ ] `GET /api/dashboard/status-distribution` — donut chart
- [ ] `GET /api/dashboard/recent-events` — 10 event gần nhất

### Frontend
- [ ] Dashboard Page hoàn chỉnh:
  - 5 metric cards (Total, Processed, Failed, Retrying, Dead)
  - Failure rate + Avg processing time
  - Line chart (events over time) — dùng Recharts
  - Donut chart (status distribution)
  - Recent events table
- [ ] Filter theo project
- [ ] Filter theo time period (24h, 7d, 30d)

### Kết quả đầu ra
- Dashboard hiển thị dữ liệu thật
- Charts animate đẹp
- Có thể filter theo project và time period

**Commit message:** `feat(dashboard): add webhook analytics dashboard`

---

## 🚀 v1.5 — CI Pipeline
**Tuần 7**

### Mục tiêu
Tự động kiểm tra code chất lượng mỗi khi push/PR.

### GitHub Actions

#### Backend CI (`.github/workflows/backend-ci.yml`)
- [ ] Trigger: push to any branch, PR to main
- [ ] Steps: `dotnet restore` → `dotnet build` → `dotnet test`

#### Frontend CI (`.github/workflows/frontend-ci.yml`)
- [ ] Trigger: push to any branch, PR to main
- [ ] Steps: `npm ci` → `npm run lint` → `npm run build`

### Kết quả đầu ra
- Mỗi push/PR tự động chạy CI
- Badge CI status trong README
- Build lỗi thì không thể merge

**Commit message:** `ci: add backend and frontend build workflows`

---

## ☁️ v1.6 — CD & Deployment
**Tuần 7**

### Mục tiêu
Tự động deploy lên VPS khi merge vào main.

### Chuẩn bị
- [ ] VPS Ubuntu với Docker + Docker Compose
- [ ] Docker Hub account (hoặc GitHub Container Registry)
- [ ] Domain (nếu có)
- [ ] GitHub Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `DOCKER_USERNAME`, `DOCKER_PASSWORD`

### CD Pipeline (`.github/workflows/deploy.yml`)
- [ ] Trigger: push to `main` branch
- [ ] Build Docker image: `backend-api`, `webhook-worker`, `frontend`
- [ ] Push images lên registry
- [ ] SSH vào VPS: pull images, `docker compose -f docker-compose.prod.yml up -d`
- [ ] Run database migration

### Production Docker Compose
- [ ] `docker-compose.prod.yml` với: postgres, redis, backend-api, webhook-worker, frontend, nginx

### Nginx Config
- [ ] `/` → frontend
- [ ] `/api` → backend-api
- [ ] HTTPS nếu có domain

### Kết quả đầu ra
- Merge main → app tự deploy lên VPS
- Webhook URL public dùng được

**Commit message:** `ci: add Docker image build and deployment workflow`

---

## ✨ v1.7 — Portfolio Polish
**Tuần 8**

### Mục tiêu
Biến dự án từ "chạy được" thành "đẹp để đưa vào CV/GitHub".

### README hoàn chỉnh
- [ ] Project introduction + badges
- [ ] Features list
- [ ] Tech stack
- [ ] Architecture diagram
- [ ] Screenshots
- [ ] Quick Start (Docker)
- [ ] API documentation link
- [ ] CI/CD badge
- [ ] Demo account

### Screenshots (chụp tất cả page)
- [ ] Landing page
- [ ] Dashboard
- [ ] Projects page
- [ ] Webhook Endpoints page
- [ ] Event Logs page
- [ ] Event Detail page (JSON viewer)
- [ ] Webhook Simulator page
- [ ] Retry Queue page

### Demo Video (2-4 phút)
- [ ] Giới thiệu HookFlow (30 giây)
- [ ] Đăng nhập, tạo project, tạo endpoint
- [ ] Gửi webhook bằng simulator
- [ ] Xem event logs và event detail
- [ ] Demo retry/replay
- [ ] Show Docker compose + CI/CD

### Docs bổ sung
- [ ] `docs/DEPLOYMENT.md` — hướng dẫn deploy VPS
- [ ] `docs/CI_CD.md` — giải thích CI/CD pipeline

### Code Quality
- [ ] Remove console.log thừa
- [ ] Add comment cho logic phức tạp
- [ ] Fix lint warnings
- [ ] Final code review

### Kết quả đầu ra
- Repo GitHub nhìn chuyên nghiệp
- Có thể show trong phỏng vấn
- Có thể đưa vào CV với confidence

**Commit message:** `docs: polish README and project documentation`

> 🎉 **Mốc 3 hoàn thành! Project portfolio-ready.**

---

## ⏰ Timeline Chi Tiết

| Ngày | Công việc | Version |
|------|-----------|---------|
| Ngày 1 | Repo + cấu trúc + docs | v0.1 |
| Ngày 2 | React app + Landing + Login + Dashboard layout | v0.2 |
| Ngày 3 | .NET solution + DB + Health endpoint | v0.3 |
| Ngày 4-5 | Auth (BE + FE) | v0.4 |
| Ngày 6-7 | Project Management | v0.5 |
| Tuần 2 | Endpoint + Incoming Webhook | v0.6, v0.7 |
| Tuần 3 | Event Logs + Simulator | v0.8, v0.9 |
| Tuần 4 | Docker | v1.0-alpha |
| Tuần 5 | Signature + Worker | v1.1, v1.2 |
| Tuần 6 | Retry + Dashboard | v1.3, v1.4 |
| Tuần 7 | CI/CD + Deploy | v1.5, v1.6 |
| Tuần 8 | Portfolio Polish | v1.7 |

---

## 🏁 Thứ tự ưu tiên khi bị thiếu thời gian

Nếu phải cắt bớt, ưu tiên giữ lại theo thứ tự:

1. **Auth + Project + Endpoint + Incoming Webhook + Event Logs + Simulator** (v0.4–v0.9) — Core MVP không thể thiếu
2. **Docker** (v1.0-alpha) — Thể hiện DevOps skill
3. **Signature Verification** (v1.1) — Security knowledge
4. **Worker + Retry** (v1.2, v1.3) — Backend depth
5. **CI** (v1.5) — Professional practice
6. **Dashboard Analytics** (v1.4) — Nice to have
7. **CD/Deploy** (v1.6) — Bonus point
8. **Portfolio Polish** (v1.7) — Không bao giờ bỏ qua

---

*Tài liệu này thuộc về dự án HookFlow — Webhook Event Processor*
*Phiên bản tài liệu: 1.0 | Cập nhật: 2026*

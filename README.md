<h1 align="center">
  <img src="docs/assets/hookflow-logo.png" alt="HookFlow Logo" width="80" />
  <br/>
  HookFlow
</h1>

<p align="center">
  <strong>Webhook Event Processor — Nhận, xác thực, lưu trữ và giám sát webhook một cách chuyên nghiệp</strong>
</p>

<p align="center">
  <a href="#-tính-năng">Tính năng</a> •
  <a href="#-kiến-trúc">Kiến trúc</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-lộ-trình">Lộ trình</a> •
  <a href="#-tài-liệu">Tài liệu</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/.NET-8.0-512BD4?style=for-the-badge&logo=dotnet" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis" />
</p>

---

## 📖 Giới thiệu

**HookFlow** là một nền tảng quản lý toàn bộ vòng đời (lifecycle) của webhook event dành cho developer và team kỹ thuật.

Thay vì tự xây dựng lại từ đầu mỗi lần tích hợp webhook, HookFlow cung cấp một hệ thống hoàn chỉnh:

- ✅ **Nhận webhook** từ GitHub, cổng thanh toán, CI/CD, hoặc bất kỳ service nào
- ✅ **Xác thực chữ ký** HMAC SHA256 chống giả mạo
- ✅ **Lưu raw payload** để không bao giờ mất dữ liệu
- ✅ **Chống xử lý trùng** (idempotency) khi webhook được gửi nhiều lần
- ✅ **Xử lý bất đồng bộ** qua background worker
- ✅ **Retry tự động** với exponential backoff khi xử lý lỗi
- ✅ **Dead Letter Queue** cho event lỗi quá nhiều lần
- ✅ **Dashboard realtime** để debug, replay, và giám sát
- ✅ **Webhook Simulator** để test endpoint ngay trong app

> HookFlow = Postman + Sentry + Queue Monitor — tập trung hoàn toàn vào webhook lifecycle management

---

## ✨ Tính năng

### 🔐 Bảo mật
- HMAC SHA256 Signature Verification
- Secret key per-endpoint, có thể regenerate
- Phát hiện và đánh dấu `InvalidSignature` request
- JWT Authentication cho dashboard

### 📦 Quản lý Event
- Nhận webhook và lưu raw payload + headers ngay lập tức
- Idempotency check qua `ExternalEventId`
- Event status lifecycle: `Received → Pending → Processing → Processed / Retrying → Dead`
- Retry với chiến lược exponential backoff (1m → 5m → 15m → 1h)
- Manual replay cho Dead events

### 📊 Dashboard & Monitoring
- Metrics tổng quan: Total / Processed / Failed / Retrying / Dead events
- Biểu đồ event theo thời gian
- Event logs với filter theo status, type, endpoint, date range
- Chi tiết payload JSON với syntax highlighting
- Processing timeline và attempt history
- Retry queue management

### 🧪 Developer Tools
- Webhook Simulator: gửi test webhook trực tiếp từ dashboard
- Xem headers, payload, signature validation kết quả
- Copy endpoint URL, curl command

### 🗂️ Tổ chức
- Projects để gom nhóm các endpoint
- Multiple endpoints per project
- Provider presets: GitHub, Generic HMAC, Payment, CI/CD

---

## 🏗️ Kiến trúc

```
External Service (GitHub / Payment / CI-CD)
        │
        ▼  POST /api/incoming-webhooks/{slug}
┌───────────────────────────┐
│     ASP.NET Core API      │
│  • Verify signature       │
│  • Check duplicate        │
│  • Save event (Pending)   │
│  • Return 200 OK fast     │
└───────────┬───────────────┘
            │
            ▼  Event queued
┌───────────────────────────┐
│    Background Worker      │
│  • Poll Pending events    │
│  • Process business logic │
│  • Retry on failure       │
│  • Update status          │
└───────────┬───────────────┘
            │
            ▼
┌───────────────────────────┐
│   React Dashboard (SPA)   │
│  • Realtime monitoring    │
│  • Debug & replay tools   │
└───────────────────────────┘
```

### Services

| Service | Technology | Port | Mô tả |
|---------|-----------|------|-------|
| `frontend` | React 18 + Vite | 5173 | Dashboard SPA |
| `backend-api` | ASP.NET Core 8 | 5000 | REST API |
| `webhook-worker` | .NET Worker Service | — | Background processor |
| `postgres` | PostgreSQL 16 | 5432 | Database chính |
| `redis` | Redis 7 | 6379 | Queue & cache |
| `nginx` | Nginx | 80/443 | Reverse proxy |
| `mailhog` | MailHog | 8025 | Email testing (dev) |

---

## 🚀 Quick Start

### Yêu cầu

- [Docker](https://www.docker.com/get-started) & Docker Compose
- [.NET 8 SDK](https://dotnet.microsoft.com/download) (nếu phát triển local)
- [Node.js 20+](https://nodejs.org/) (nếu phát triển local)

### Chạy bằng Docker Compose

```bash
# 1. Clone repository
git clone https://github.com/phanhoaian1203/hookflow.git
cd hookflow

# 2. Copy environment file
cp .env.example .env

# 3. Khởi động toàn bộ stack
docker-compose up -d

# 4. Chạy database migration
docker-compose exec backend-api dotnet ef database update

# 5. Truy cập ứng dụng
# Dashboard:  http://localhost:5173
# API:        http://localhost:5000
# API Docs:   http://localhost:5000/swagger
# MailHog:    http://localhost:8025
```

### Phát triển local (không dùng Docker)

```bash
# Backend API
cd backend/src/HookFlow.Api
dotnet run

# Worker
cd backend/src/HookFlow.Worker
dotnet run

# Frontend
cd frontend
npm install
npm run dev
```

---

## 🛠️ Tech Stack

### Backend
- **ASP.NET Core 8** — Web API framework
- **Entity Framework Core 8** — ORM với PostgreSQL
- **MediatR** — CQRS pattern
- **FluentValidation** — Request validation
- **Serilog** — Structured logging
- **BCrypt.Net** — Password hashing
- **System.IdentityModel.Tokens.Jwt** — JWT authentication

### Frontend
- **React 18** — UI framework
- **Vite** — Build tool
- **React Router v6** — Client-side routing
- **TanStack Query (React Query)** — Server state management
- **Recharts** — Charts và biểu đồ
- **Monaco Editor** — JSON payload viewer

### Infrastructure
- **PostgreSQL 16** — Database chính
- **Redis 7** — Queue và caching
- **Docker & Docker Compose** — Containerization
- **Nginx** — Reverse proxy
- **GitHub Actions** — CI/CD pipeline

---

## 📅 Lộ trình

| Version | Nội dung | Trạng thái |
|---------|----------|-----------|
| **V1** | Auth, Projects, Endpoints, Receive Webhook, Event Logs, Dashboard cơ bản | 🚧 In Progress |
| **V2** | HMAC Signature Verification, Secret Key Management | 📋 Planned |
| **V3** | Background Worker, Processing Attempts, Async Event Processing | 📋 Planned |
| **V4** | Retry Logic, Exponential Backoff, Dead Letter Queue, Manual Replay | 📋 Planned |
| **V5** | Docker multi-service, Nginx, Redis, full docker-compose | 📋 Planned |
| **V6** | GitHub Actions CI/CD, Docker Hub, Deploy to VPS | 📋 Planned |

Chi tiết xem tại [ROADMAP.md](docs/ROADMAP.md).

---

## 📚 Tài liệu

| Tài liệu | Mô tả |
|---------|-------|
| [PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) | Tổng quan dự án chi tiết |
| [REQUIREMENTS.md](docs/REQUIREMENTS.md) | Yêu cầu chức năng và phi chức năng |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Kiến trúc hệ thống |
| [DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) | Thiết kế database schema |
| [API_DESIGN.md](docs/API_DESIGN.md) | API endpoints specification |
| [ROADMAP.md](docs/ROADMAP.md) | Lộ trình phát triển chi tiết |

---

## 🔄 Luồng xử lý webhook

```
1. External service gửi POST /api/incoming-webhooks/{slug}
2. API tìm endpoint theo slug → 404 nếu không tồn tại
3. Kiểm tra endpoint active → 403 nếu bị disabled
4. Kiểm tra event type được phép → Ignored nếu không hợp lệ
5. Verify HMAC signature → InvalidSignature nếu sai
6. Kiểm tra ExternalEventId → Duplicate nếu đã tồn tại
7. Lưu event với status = Pending
8. Trả 200 OK ngay lập tức
9. Worker poll event Pending → xử lý business logic
10. Cập nhật status: Processed / Retrying / Dead
11. Dashboard hiển thị kết quả realtime
```

---

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch: `git checkout -b feature/ten-tinh-nang`
3. Commit changes: `git commit -m 'feat: thêm tính năng X'`
4. Push branch: `git push origin feature/ten-tinh-nang`
5. Tạo Pull Request

### Commit Convention

```
feat: thêm tính năng mới
fix: sửa lỗi
docs: cập nhật tài liệu
chore: cấu hình, build tools
refactor: tái cấu trúc code
test: thêm/sửa test
```

---

## 📄 License

MIT License — xem [LICENSE](LICENSE) để biết thêm chi tiết.

---

<p align="center">
  Được xây dựng với ❤️ bởi <a href="https://github.com/phanhoaian1203">phanhoaian1203</a>
</p>

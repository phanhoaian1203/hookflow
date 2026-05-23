# HookFlow — Architecture

> Tài liệu mô tả kiến trúc hệ thống của HookFlow Webhook Event Processor.

---

## 1. Tổng quan kiến trúc

HookFlow theo mô hình **Layered Architecture** kết hợp với **Service-Oriented Architecture**, trong đó API và Worker là hai service độc lập, cùng chia sẻ database và message queue.

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│         React 18 SPA (Vite + TypeScript)                    │
│  Dashboard │ Event Logs │ Simulator │ Project Manager       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP / REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   API GATEWAY LAYER                         │
│                  Nginx (Reverse Proxy)                      │
│         /app/* → frontend   │   /api/* → backend           │
└──────────┬──────────────────────────────────┬──────────────┘
           │                                  │
           ▼                                  ▼
┌──────────────────────┐          ┌──────────────────────────┐
│   ASP.NET Core API   │          │   .NET Worker Service    │
│                      │          │                          │
│ • Auth endpoints     │          │ • Poll Pending events    │
│ • Project CRUD       │          │ • Process event logic    │
│ • Endpoint CRUD      │          │ • Write ProcessAttempts  │
│ • Incoming Webhook   │          │ • Retry scheduling       │
│ • Event Logs API     │          │ • Dead Letter handling   │
│ • Dashboard API      │          │                          │
└──────┬───────────────┘          └────────────┬─────────────┘
       │                                        │
       │      ┌─────────────────────────────────┘
       ▼      ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATA LAYER                                │
│                                                             │
│  ┌─────────────────────┐    ┌──────────────────────────┐   │
│  │   PostgreSQL 16      │    │       Redis 7            │   │
│  │                     │    │                          │   │
│  │ • Users             │    │ • Job Queue (future)     │   │
│  │ • Projects          │    │ • Session Cache          │   │
│  │ • WebhookEndpoints  │    │ • Rate Limit State       │   │
│  │ • WebhookEvents     │    │                          │   │
│  │ • ProcessingAttempts│    │                          │   │
│  │ • AuditLogs         │    │                          │   │
│  └─────────────────────┘    └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Luồng dữ liệu chính (Data Flow)

### 2.1 Luồng nhận và xử lý webhook

```
External Service (GitHub / Payment / CI-CD)
        │
        │  POST /api/incoming-webhooks/{slug}
        │  Headers: Content-Type, X-Webhook-Event, X-Webhook-Signature
        │  Body: { "event": "payment.success", ... }
        ▼
┌─────────────────────────────────────────┐
│         Nginx (port 80)                 │
│   Route /api/* → backend-api:5000       │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│      IncomingWebhookController          │
│                                         │
│  1. Extract {slug} từ URL               │
│  2. Read raw body (EnableBuffering)     │
│  3. Read headers                        │
│  4. Find WebhookEndpoint by slug        │
│     └─ Not found → 404                 │
│     └─ Inactive → 403                  │
│  5. Check allowed event types           │
│     └─ Not allowed → Status: Ignored   │
│  6. Verify HMAC signature               │
│     └─ Invalid → Status: InvalidSig    │
│  7. Check ExternalEventId duplicate     │
│     └─ Duplicate → Status: Duplicate   │
│  8. Save WebhookEvent (Status: Pending) │
│  9. Return 200 OK                       │
└──────────────────┬──────────────────────┘
                   │ Write
                   ▼
┌─────────────────────────────────────────┐
│           PostgreSQL                    │
│     Table: WebhookEvents                │
│     Status: Pending                     │
└──────────────────┬──────────────────────┘
                   │ Poll (every 5s)
                   ▼
┌─────────────────────────────────────────┐
│         WebhookWorker Service           │
│                                         │
│  1. Query events WHERE Status=Pending   │
│  2. Set Status = Processing             │
│  3. Create ProcessingAttempt            │
│  4. Execute business logic              │
│     └─ Success → Status: Processed     │
│     └─ Failure → Status: Retrying      │
│         RetryCount++                    │
│         Calculate NextRetryAt           │
│     └─ MaxRetry exceeded → Dead        │
│  5. Update ProcessingAttempt            │
└─────────────────────────────────────────┘
```

### 2.2 Luồng xác thực người dùng

```
Frontend (Login Page)
        │
        │  POST /api/auth/login
        │  { email, password }
        ▼
API → Find User → Verify BCrypt → Generate JWT → Return Token
        │
        ▼
Frontend stores token in memory/localStorage
        │
        │  GET /api/projects
        │  Authorization: Bearer <jwt_token>
        ▼
API → Validate JWT → Extract UserId → Filter by OwnerId → Return Data
```

---

## 3. Backend Architecture

### 3.1 Clean Architecture — Project Structure

```
backend/
├── HookFlow.Api/                    # Presentation Layer
│   ├── Controllers/
│   │   ├── AuthController.cs
│   │   ├── ProjectsController.cs
│   │   ├── WebhookEndpointsController.cs
│   │   ├── IncomingWebhookController.cs
│   │   ├── WebhookEventsController.cs
│   │   └── DashboardController.cs
│   ├── Middlewares/
│   │   ├── ExceptionHandlingMiddleware.cs
│   │   └── RequestLoggingMiddleware.cs
│   ├── Extensions/
│   └── Program.cs
│
├── HookFlow.Application/            # Business Logic Layer
│   ├── Features/
│   │   ├── Auth/
│   │   │   ├── Commands/
│   │   │   │   ├── RegisterCommand.cs
│   │   │   │   └── LoginCommand.cs
│   │   │   └── Queries/
│   │   │       └── GetCurrentUserQuery.cs
│   │   ├── Projects/
│   │   ├── WebhookEndpoints/
│   │   ├── IncomingWebhooks/
│   │   └── WebhookEvents/
│   ├── DTOs/
│   ├── Interfaces/
│   │   ├── IWebhookSignatureVerifier.cs
│   │   └── IEventProcessor.cs
│   └── Common/
│       └── PagedResult.cs
│
├── HookFlow.Domain/                 # Domain Layer
│   ├── Entities/
│   │   ├── User.cs
│   │   ├── Project.cs
│   │   ├── WebhookEndpoint.cs
│   │   ├── WebhookEvent.cs
│   │   └── ProcessingAttempt.cs
│   ├── Enums/
│   │   ├── WebhookEventStatus.cs
│   │   ├── WebhookProvider.cs
│   │   └── RetryStrategy.cs
│   └── Common/
│       └── BaseEntity.cs
│
├── HookFlow.Infrastructure/         # Infrastructure Layer
│   ├── Persistence/
│   │   ├── HookFlowDbContext.cs
│   │   ├── Migrations/
│   │   └── Repositories/
│   ├── Services/
│   │   ├── HmacSha256SignatureVerifier.cs
│   │   ├── JwtTokenService.cs
│   │   └── SecretKeyGenerator.cs
│   └── Configuration/
│       └── InfrastructureServiceExtensions.cs
│
├── HookFlow.Worker/                 # Worker Service
│   ├── Workers/
│   │   ├── EventProcessingWorker.cs
│   │   └── RetrySchedulerWorker.cs
│   └── Program.cs
│
└── HookFlow.Tests/                  # Test Project
    ├── Unit/
    └── Integration/
```

### 3.2 Dependency Flow

```
Api → Application → Domain
Infrastructure → Application → Domain
Worker → Application → Domain
```

> **Domain** không phụ thuộc vào bất cứ layer nào khác (Pure C# objects).

---

## 4. Frontend Architecture

### 4.1 Cấu trúc thư mục

```
frontend/src/
├── app/
│   └── App.tsx                      # Root component
│
├── assets/                          # Static assets (icons, images)
│
├── components/
│   ├── ui/                          # Reusable UI primitives
│   │   ├── Button/
│   │   ├── Badge/
│   │   ├── Card/
│   │   ├── Modal/
│   │   ├── Table/
│   │   └── JsonViewer/
│   ├── layout/                      # Layout components
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── AppLayout.tsx
│   └── common/                      # Shared feature components
│       ├── StatusBadge.tsx
│       └── CopyButton.tsx
│
├── features/                        # Feature-based modules
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── projects/
│   ├── endpoints/
│   ├── events/
│   ├── dashboard/
│   └── simulator/
│
├── hooks/                           # Global custom hooks
│   ├── useAuth.ts
│   └── useToast.ts
│
├── lib/                             # Utilities & configs
│   ├── api.ts                       # Axios instance
│   ├── queryClient.ts               # React Query client
│   └── utils.ts
│
├── pages/                           # Route-level page components
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── ProjectsPage.tsx
│   ├── EndpointsPage.tsx
│   ├── EventLogsPage.tsx
│   ├── EventDetailPage.tsx
│   ├── SimulatorPage.tsx
│   └── RetryQueuePage.tsx
│
├── routes/
│   ├── AppRouter.tsx                # Main router
│   └── ProtectedRoute.tsx           # Auth guard
│
├── services/                        # API service functions
│   ├── auth.service.ts
│   ├── project.service.ts
│   ├── endpoint.service.ts
│   └── event.service.ts
│
├── types/                           # TypeScript interfaces
│   ├── auth.types.ts
│   ├── project.types.ts
│   ├── event.types.ts
│   └── api.types.ts
│
└── main.tsx                         # Entry point
```

### 4.2 State Management Strategy

| Loại State | Tool | Mục đích |
|-----------|------|---------|
| **Server state** | TanStack Query | Fetch, cache, sync data từ API |
| **Auth state** | React Context | User info, token, login status |
| **Form state** | React Hook Form + Zod | Form validation |
| **UI state** | React useState | Modal open/close, loading, etc. |
| **URL state** | React Router | Filter params, pagination |

### 4.3 Routing Structure

```
/                           → Landing Page (public)
/login                      → Login Page (public)
/register                   → Register Page (public)
/dashboard                  → Dashboard (protected)
/projects                   → Projects List (protected)
/projects/:id               → Project Detail (protected)
/endpoints                  → All Endpoints (protected)
/endpoints/:id              → Endpoint Detail (protected)
/events                     → Event Logs (protected)
/events/:id                 → Event Detail (protected)
/simulator                  → Webhook Simulator (protected)
/retry-queue                → Retry Queue (protected)
/settings                   → User Settings (protected)
```

---

## 5. Database Architecture

### 5.1 Entity Relationship Diagram

```
┌──────────────┐       ┌────────────────┐       ┌───────────────────────┐
│    Users     │───1:N─│    Projects    │───1:N─│   WebhookEndpoints    │
│              │       │                │       │                       │
│ Id (PK)      │       │ Id (PK)        │       │ Id (PK)               │
│ FullName     │       │ OwnerId (FK)   │       │ ProjectId (FK)        │
│ Email        │       │ Name           │       │ Name                  │
│ PasswordHash │       │ Description    │       │ Slug (UNIQUE)         │
│ Role         │       │ Status         │       │ Provider              │
│ CreatedAt    │       │ CreatedAt      │       │ SecretKeyHash         │
└──────────────┘       └────────────────┘       │ IsActive              │
                                                │ AllowedEventTypes     │
                                                │ MaxRetryAttempts      │
                                                └──────────┬────────────┘
                                                           │
                                                        1:N│
                                                           ▼
                                                ┌──────────────────────┐
                                                │   WebhookEvents      │
                                                │                      │
                                                │ Id (PK)              │
                                                │ EndpointId (FK)      │
                                                │ ExternalEventId      │
                                                │ EventType            │
                                                │ PayloadJson          │
                                                │ HeadersJson          │
                                                │ SourceIp             │
                                                │ Status               │
                                                │ SignatureValid        │
                                                │ RetryCount           │
                                                │ NextRetryAt          │
                                                │ ErrorMessage         │
                                                │ ReceivedAt           │
                                                │ ProcessedAt          │
                                                └──────────┬───────────┘
                                                           │
                                                        1:N│
                                                           ▼
                                                ┌──────────────────────┐
                                                │  ProcessingAttempts  │
                                                │                      │
                                                │ Id (PK)              │
                                                │ WebhookEventId (FK)  │
                                                │ AttemptNumber        │
                                                │ Status               │
                                                │ StartedAt            │
                                                │ FinishedAt           │
                                                │ DurationMs           │
                                                │ ErrorMessage         │
                                                │ WorkerName           │
                                                └──────────────────────┘
```

Chi tiết xem tại [DATABASE_DESIGN.md](DATABASE_DESIGN.md).

---

## 6. Docker Architecture

### 6.1 Services và Ports

```
┌─────────────────────────────────────────────────────────┐
│                     Host Machine                        │
│                                                         │
│  :80 ──────► nginx ──────────► /app → frontend:80      │
│                          └────► /api → backend-api:5000 │
│                                                         │
│  :5173 ─────► frontend (direct, dev mode)               │
│  :5000 ─────► backend-api (direct, dev mode)            │
│  :5432 ─────► postgres                                  │
│  :6379 ─────► redis                                     │
│  :8025 ─────► mailhog (Web UI, dev only)                │
│  :1025 ─────► mailhog (SMTP, dev only)                  │
└─────────────────────────────────────────────────────────┘
                       hookflow-net (bridge network)
```

### 6.2 Service Dependencies

```
postgres ◄──── backend-api
              webhook-worker
redis    ◄──── backend-api (future)
              webhook-worker (future)

backend-api ◄── frontend (depends_on for start order)
postgres ◄────── webhook-worker
```

### 6.3 Docker Compose Profiles

| Profile | Services | Dùng khi |
|---------|---------|---------|
| *(default)* | postgres, redis, backend-api, webhook-worker, frontend | Development |
| `production` | + nginx | Deploy production |
| `dev` | + mailhog | Test email local |

---

## 7. CI/CD Architecture

### 7.1 CI Pipeline (GitHub Actions)

```
Push / Pull Request
        │
        ├──► Backend CI (.github/workflows/backend-ci.yml)
        │    │
        │    ├── dotnet restore
        │    ├── dotnet build
        │    └── dotnet test
        │
        └──► Frontend CI (.github/workflows/frontend-ci.yml)
             │
             ├── npm ci
             ├── npm run lint
             └── npm run build
```

### 7.2 CD Pipeline (merge to main)

```
Merge to main
        │
        ├── Build Docker image: backend-api
        ├── Build Docker image: webhook-worker
        ├── Build Docker image: frontend
        ├── Push images to Docker Hub / GHCR
        │
        ├── SSH to VPS
        │   ├── Pull new images
        │   ├── docker compose -f docker-compose.prod.yml up -d
        │   └── dotnet ef database update
        │
        └── Notify (Slack / Email)
```

---

## 8. Technology Stack Summary

### Backend
| Layer | Technology |
|-------|-----------|
| Framework | ASP.NET Core 8 |
| ORM | Entity Framework Core 8 |
| Database | PostgreSQL 16 (Npgsql provider) |
| Cache/Queue | Redis 7 (StackExchange.Redis) |
| Auth | JWT Bearer (Microsoft.AspNetCore.Authentication.JwtBearer) |
| Password | BCrypt.Net-Next |
| Validation | FluentValidation |
| Logging | Serilog + Serilog.Sinks.Console |
| API Docs | Swashbuckle (Swagger UI) / Scalar |
| Testing | xUnit + Moq + FluentAssertions |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Build Tool | Vite 5 |
| Language | TypeScript 5 |
| Routing | React Router v6 |
| Server State | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| HTTP Client | Axios |
| Styling | Tailwind CSS v3 |
| Charts | Recharts |
| Code Editor | Monaco Editor (JSON viewer) |

### Infrastructure
| Component | Technology |
|-----------|-----------|
| Containerization | Docker + Docker Compose |
| Reverse Proxy | Nginx Alpine |
| CI/CD | GitHub Actions |
| Registry | Docker Hub / GitHub Container Registry |
| Email (dev) | MailHog |

---

*Tài liệu này thuộc về dự án HookFlow — Webhook Event Processor*
*Phiên bản tài liệu: 1.0 | Cập nhật: 2026*

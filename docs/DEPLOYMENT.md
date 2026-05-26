# HookFlow — Production Deployment Guide

This guide outlines the production deployment methodologies for the HookFlow platform, covering both Giai Đoạn 1 (Cloud Serverless / PaaS Free Tier) and Giai Đoạn 2 (Self-Hosted VPS + Docker Compose).

---

## 🚀 Giai Đoạn 1: Cloud Serverless / PaaS Free Tier (Vercel + Render + Neon)

This deployment model is optimized for quick, zero-cost portfolio delivery. The Webhook Background Worker is integrated *in-process* as a hosted service within the Web API to run seamlessly inside a single Render container.

### 🗄️ Step 1: Database Setup on Neon Cloud
1. Create a free account on [neon.tech](https://neon.tech/) using your GitHub credentials.
2. Spin up a new PostgreSQL database project. Choose the **Asia Pacific (Singapore)** AWS region to minimize network latency.
3. In the Neon Console, fetch the connection string under the **.NET (Npgsql)** connection tab. Copy it and strip the double quotes (`"`).

### 🖥️ Step 2: Backend API Setup on Render
1. Register on [render.com](https://render.com/) and create a new **Web Service** connected to your `hookflow` GitHub repository.
2. Configure basic settings:
   - **Name:** `hookflow-api`
   - **Runtime:** `Docker`
   - **Root Directory:** `backend`
   - **Dockerfile Path:** `Dockerfile.api`
3. Configure **Environment Variables** under the `Environment` tab:
   - `ConnectionStrings__DefaultConnection`: *[Your Neon Connection String]*
   - `Jwt__Secret`: `hookflow_secure_production_jwt_secret_key_2026_must_be_long_enough`
   - `Jwt__Issuer`: `HookFlow`
   - `Jwt__Audience`: `HookFlowUsers`
   - `ASPNETCORE_ENVIRONMENT`: `Production`
   - `Cors__AllowedOrigins`: `https://[your-frontend-vercel-subdomain].vercel.app` (Add your Vercel URL here after deploying!).
4. Trigger the deploy. On startup, Entity Framework Core will automatically execute all database migrations.

### 🌐 Step 3: Frontend React Setup on Vercel
1. Log in to [vercel.com](https://vercel.com/) and import the `hookflow` repository.
2. Configure build settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
3. Configure **Environment Variables**:
   - `VITE_API_URL`: `https://hookflow-api.onrender.com/api` (Point to your live Render URL!).
4. Click **Deploy**. Your React application will go live with HTTPS immediately.

---

## 🔒 Giai Đoạn 2: Self-Hosted VPS + Docker Compose (Enterprise Setup)

This is the ultimate professional production deployment using a Virtual Private Server (VPS), containerizing all layers natively (PostgreSQL, Redis, API, Worker, Nginx, SSL).

### 📐 Production Architecture Layout
```
                          Internet (HTTPS)
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ Nginx Reverse Proxy   │ (Port 80/443 with SSL)
                     └───────────┬───────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       ┌──────────────────┐            ┌──────────────────┐
       │ frontend         │            │ backend-api      │ (Port 5000)
       │ (Port 80)        │            │                  │
       └──────────────────┘            └────────┬─────────┘
                                                │
                                       ┌────────┴────────┐
                                       ▼                 ▼
                             ┌──────────────────┐ ┌──────────────┐
                             │ webhook-worker   │ │ redis-cache  │ (Port 6379)
                             └────────┬─────────┘ └──────────────┘
                                      │
                                      ▼
                             ┌──────────────────┐
                             │ postgres-db      │ (Port 5432)
                             └──────────────────┘
```

### 🐳 The Production Compose: `docker-compose.prod.yml`
Create a `docker-compose.prod.yml` in the project root:
```yaml
version: '3.8'

services:
  postgres-db:
    image: postgres:16-alpine
    container_name: hookflow-postgres-prod
    restart: always
    environment:
      POSTGRES_DB: hookflow_db
      POSTGRES_USER: hookflow_admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    networks:
      - hookflow-network

  redis-cache:
    image: redis:7-alpine
    container_name: hookflow-redis-prod
    restart: always
    networks:
      - hookflow-network

  backend-api:
    build:
      context: ./backend
      dockerfile: Dockerfile.api
    container_name: hookflow-api-prod
    restart: always
    environment:
      - ConnectionStrings__DefaultConnection=Host=postgres-db;Database=hookflow_db;Username=hookflow_admin;Password=${DB_PASSWORD}
      - Jwt__Secret=${JWT_SECRET}
      - Redis__ConnectionString=redis-cache:6379
      - ASPNETCORE_ENVIRONMENT=Production
    depends_on:
      - postgres-db
      - redis-cache
    networks:
      - hookflow-network

  webhook-worker:
    build:
      context: ./backend
      dockerfile: Dockerfile.worker
    container_name: hookflow-worker-prod
    restart: always
    environment:
      - ConnectionStrings__DefaultConnection=Host=postgres-db;Database=hookflow_db;Username=hookflow_admin;Password=${DB_PASSWORD}
      - Redis__ConnectionString=redis-cache:6379
    depends_on:
      - postgres-db
      - redis-cache
    networks:
      - hookflow-network

  nginx-proxy:
    image: nginx:alpine
    container_name: hookflow-nginx-prod
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/certs:/etc/nginx/certs:ro
    depends_on:
      - backend-api
    networks:
      - hookflow-network

volumes:
  postgres_prod_data:

networks:
  hookflow-network:
    driver: bridge
```

### 📜 Nginx Configuration (`nginx.conf`)
Save the following configuration inside `./nginx/nginx.conf` to direct routing and handle SSL:
```nginx
events { worker_connections 1024; }

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    upstream api_server {
        server backend-api:5000;
    }

    server {
        listen 80;
        server_name hookflow.live api.hookflow.live;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
        server_name hookflow.live;

        ssl_certificate     /etc/nginx/certs/fullchain.pem;
        ssl_certificate_key /etc/nginx/certs/privkey.pem;

        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }
    }

    server {
        listen 443 ssl;
        server_name api.hookflow.live;

        ssl_certificate     /etc/nginx/certs/fullchain.pem;
        ssl_certificate_key /etc/nginx/certs/privkey.pem;

        location / {
            proxy_pass         http://api_server;
            proxy_redirect     off;
            proxy_set_header   Host $host;
            proxy_set_header   X-Real-IP $remote_addr;
            proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header   X-Forwarded-Proto $scheme;
        }
    }
}
```

### 🛠️ Execution Roadmap on Ubuntu VPS
1. **Connect to VPS:**
   ```bash
   ssh root@your_vps_ip
   ```
2. **Install Docker:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```
3. **Obtain SSL Certificates (via Certbot/Let's Encrypt):**
   ```bash
   apt-get install certbot -y
   certbot certonly --standalone -d hookflow.live -d api.hookflow.live
   # Symlink cert files to ./nginx/certs/
   ```
4. **Deploy Application:**
   Configure environment variables in `.env` and launch Docker Compose:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

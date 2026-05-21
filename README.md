# <p align="center"><img src=".github/assets/banner.png" alt="SubVault Banner" width="100%"></p>

<p align="center">
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind v4"></a>
  <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"></a>
  <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express-4.19-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"></a>
  <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/Prisma-5.14-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma"></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-15.0-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"></a>
</p>

---

## 🚀 Overview

**SubVault** is an enterprise-grade, high-performance SaaS subscription billing and analytics infrastructure platform. Designed to wow users with rich animations and futuristic aesthetics, SubVault automates plan tiering, billing calendars, invoice generation, smart payment retries (dunning), and telemetry logging.

Whether you're developing on a local machine with zero databases configured or deploying to a production Kubernetes cluster, SubVault scales instantly thanks to its **hybrid JSON-fallback database engine**.

<p align="center"><img src=".github/assets/dashboard_preview.png" alt="SubVault Dashboard Preview" width="100%"></p>

---

## ⚡ Core Features

- 🔄 **Full Subscription Lifecycle**: Interactive state machine managing active, trialing, past due, grace periods, and canceled subscription states.
- 📐 **Prorated Migrations**: Dynamic, in-flight plan upgrades and downgrades with real-time credit proration calculations.
- 📄 **Automated Invoice Engine**: Instant invoice generation and tracking paired with standard compliance reporting.
- 🛡️ **Smart Dunning & Payment Retries**: Intelligent retry logic designed to recover past due transactions and reduce involuntary churn.
- 📟 **Real-Time Telemetry & Health Logging**: Core gateway health stats (CPU, Memory, Request frequency) and socket-driven live log streaming.
- 👑 **Admin Command Center**: Elevated access controls for platform monitoring, system wide broadcast announcements, and refund queues.
- 🔋 **Zero-Setup Fallback Engine**: Server dynamically boots in **Local Storage mode** (using a JSON database) if no PostgreSQL server is available, making frontend validation completely self-contained.

---

## 🏗️ System Architecture

SubVault is designed with decoupled logic layers ensuring microservice autonomy and failover safety:

```mermaid
graph TD
    %% Frontend and Client layer
    Client[React 19 Client App] -->|Vite Proxy /api| Gateway[Express API Gateway]
    
    %% API Gateway to Microservice Routers
    Gateway -->|Auth Routes| AuthRouter[Auth Router]
    Gateway -->|Subscription Routes| SubRouter[Subscription Router]
    Gateway -->|Admin telemetry| AdminRouter[Admin Router]
    
    %% Microservices to Core systems
    AuthRouter --> DBService[Unified DB client]
    SubRouter --> DBService
    AdminRouter --> DBService
    AdminRouter -->|Broadcast| Socket[Socket.io WebSockets Server]
    
    %% DB Client hybrid fallbacks
    DBService -->|DATABASE_URL defined| Prisma[Prisma ORM]
    DBService -->|No DATABASE_URL| JSONDB[db_fallback.json Local Store]
    
    Prisma --> Postgres[(PostgreSQL Database)]
    Socket -->|Real-Time Telemetry| Client
```

---

## ⚙️ Configuration & Environment

The application is configured using environment files located in the root and server directory.

### Root / Server `.env` File Parameters
Create a `.env` in the root (for docker-compose) or inside the `/server` folder:

```ini
# Backend gateway configuration
PORT=5001
NODE_ENV=development

# Database connection (Prisma)
# Omit or leave empty to boot in JSON fallback mode
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/subscription_db?schema=public"

# Auth Secret signature keys
JWT_SECRET="super-secret-key-signature-token-12345"
```

---

## 🛠️ Getting Started

### Option 1: Quick Dev Launch (Auto DB Fallback)

If you don't have PostgreSQL installed, SubVault automatically runs using a local JSON database file.

1. **Install Dependencies**
   ```bash
   # In the root project folder
   npm install
   
   # In the server folder
   cd server && npm install && cd ..
   ```

2. **Boot the Backend Server**
   ```bash
   cd server
   npm run dev
   ```
   *The server will start on [http://localhost:5001](http://localhost:5001) in local JSON storage mode.*

3. **Boot the Frontend Client**
   ```bash
   # In a separate terminal tab in the root folder
   npm run dev
   ```
   *The client will start on [http://localhost:5173](http://localhost:5173).*

---

### Option 2: Docker Compose (Full Stack)

This option spins up the React client, Express server, and a PostgreSQL database instance containerized.

```bash
# In the root folder
docker-compose up --build
```
- **Frontend App**: Access via [http://localhost](http://localhost)
- **Backend API**: Access via [http://localhost:5001](http://localhost:5001)
- **PostgreSQL Database**: Accessible on port `5432`

---

## 🔌 API Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Payload Example |
| :--- | :--- | :--- | :--- |
| `POST` | `/signup` | Register a new platform user | `{ "name": "Name", "email": "a@b.com", "password": "xxx" }` |
| `POST` | `/login` | Authenticate and obtain JWT token | `{ "email": "a@b.com", "password": "xxx" }` |
| `GET` | `/profile` | Retrieve current profile statistics | *Requires Bearer Token* |

### 💳 Subscriptions (`/api/subscriptions`)
| Method | Endpoint | Description | Payload Example |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | List all subscriptions (admin gets all) | *Requires Bearer Token* |
| `POST` | `/` | Create a new subscription record | `{ "email": "a@b.com", "plan": "Pro", "interval": "monthly" }` |
| `PATCH`| `/:id/status` | Transition subscription status | `{ "status": "Past_Due" }` |
| `POST` | `/:id/migrate`| Move plan tier with proration credit | `{ "plan": "Enterprise", "interval": "yearly" }` |
| `DELETE`| `/:id` | Cancel/remove subscription record | *Requires Bearer Token* |
| `GET` | `/invoices` | List billing invoices history | *Requires Bearer Token* |

### 👑 Platform Management & Admin (`/api/admin`)
*(All endpoints below require Bearer Token of a user with role `ADMIN`)*
| Method | Endpoint | Description | Payload Example |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | List all platform users sanitized | *None* |
| `GET` | `/health` | Fetch Server RAM, CPU & Database statistics | *None* |
| `GET` | `/refunds` | View refund queue logs | *None* |
| `POST` | `/refunds/:id/approve` | Confirm request refund and broadcast | *None* |
| `POST` | `/refunds/:id/deny` | Terminate refund request and broadcast | *None* |
| `POST` | `/broadcast` | Dispatches system wide ws announcements | `{ "message": "System Upgrade in 10m" }` |

---

## 🛡️ License & Contributions

- Distributed under the MIT License. See [LICENSE](LICENSE) for more details.
- For contributions, please branch from `main`, perform edits, and open a Pull Request. Maintain 100% ESLint compliance.

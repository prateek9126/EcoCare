# EcoCare Backend (Node.js / Express / TypeScript / Vercel Serverless)

This directory (`backend-node`) is a complete, feature-parity TypeScript / Node.js conversion of the original Spring Boot (`backend`) service for **EcoCare EV Battery Health Management**.

It is architected specifically to be deployed seamlessly on **Vercel Serverless Functions** while retaining full capability for local standalone development on port `8080` (plug-and-play with the Vite frontend).

---

## 🚀 Key Features & Full Parity with Spring Boot Backend

1. **Authentication Service (`/api/auth`)**:
   - `POST /api/auth/send-otp`: Generates 6-digit OTP, records expiry, outputs to console and response (no external Google SMTP required).
   - `POST /api/auth/register`: Verifies OTP, hashes password with `bcryptjs`, assigns roles (`ROLE_USER` or `ROLE_COMPANY`).
   - `POST /api/auth/login`: Verifies password and returns role & credentials.

2. **EV Catalog & Smart Recommendation Engine (`/api/evs`)**:
   - `GET /api/evs`: Full catalog of 42+ EV models across scooters, bikes, and cars in India.
   - `POST /api/evs/recommend`: 6-factor multi-criteria matching algorithm (Budget Fit, Range Suitability, Local Dealer/Service Availability, User Ratings, Charging Speed, Value Score).
   - `GET /api/evs/compare`: Head-to-head EV comparison with dynamic win scoring.
   - `GET /api/evs/dealers`: Local dealership network locator with city and brand filters.
   - `GET /api/evs/service-centers`: Authorized service workshop locator.

3. **Battery Health Diagnostic & Analysis Engine (`/api/battery`)**:
   - `POST /api/battery/analyze`: Computes State-of-Health (SoH), capacity loss, degradation explanation, data confidence score, safety score (0-100), and risk level (LOW, MEDIUM, HIGH). Auto-computes deltas against past telemetry scans.
   - `GET /api/battery/vehicle/:vehicleId`: Historical telemetry timeline for a specific vehicle.
   - `GET /api/battery/vehicles`: Fleet overview of user vehicles with last scan scores.
   - `GET /api/battery/public/assessment/:id`: Public shareable battery certificate.
   - `POST /api/battery/complaint`: In-app customer complaint submission.

4. **EV Charging Station Network (`/api/charging-stations`)**:
   - `GET /api/charging-stations/nearby`: Haversine geographic distance calculation with radius filtering. Pre-seeded with 20 stations across Odisha and metro regions.

5. **Company & Manufacturer Telemetry Intelligence (`/api/company`)**:
   - `GET /api/company/dashboard/summary`: Executive KPIs, MoM growth rates, fleet average SoH.
   - `GET /api/company/sales/monthly`: Monthly sales trajectory.
   - `GET /api/company/sales/models`: Model sales volume rankings.
   - `GET /api/company/battery-health`: Battery degradation benchmarks by vehicle model.
   - `GET /api/company/service/summary`: Service visit analytics, repair times, and first-service funnel.
   - `GET /api/company/service/problems`: Incident root-cause analysis and monthly complaint curves.
   - `GET /api/company/service/problems/by-model`: Problem distribution matrix.
   - `GET /api/company/insights`: Engineering insights (charging rates, high temp impacts, etc.).

6. **Second-Life Battery Marketplace & Digital Passports (`/api/marketplace`)**:
   - `POST /api/marketplace/listings`: List pre-owned EV battery modules.
   - `GET /api/marketplace/listings`: Filter by city, state, chemistry, price, and SoH.
   - `POST /api/marketplace/passport-links`: Link vehicle battery passport to seller's mobile number.
   - `POST /api/marketplace/passport-links/send-otp`: Request buyer inspection OTP.
   - `POST /api/marketplace/passport-links/verify`: Securely unlock verified passport diagnostics.

---

## 🛠️ Environment Configuration (`.env`)

Configure the following variables in `.env` (or in Vercel Project Settings):

```env
PORT=8080
NODE_ENV=development

# Database Connection (Neon, Supabase, Render, or Local PostgreSQL)
DATABASE_URL=postgres://ev_battery_health_user:aI2N6lKkU31y4qIeX9wZ8vB7cD0eF1g@dpg-cuid6gl2ng1s73bk0iog-a.oregon-postgres.render.com/ev_battery_health

# Optional alternative connection variable (automatically recognized on Vercel Postgres)
POSTGRES_URL=postgres://ev_battery_health_user:aI2N6lKkU31y4qIeX9wZ8vB7cD0eF1g@dpg-cuid6gl2ng1s73bk0iog-a.oregon-postgres.render.com/ev_battery_health
```

---

## 💻 Local Execution

1. Navigate to the `backend-node` folder:
   ```bash
   cd backend-node
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The server will start at `http://localhost:8080`, initialize all tables and seed data automatically on startup.

---

## ☁️ Deploying on Vercel

### Option 1: Vercel CLI
```bash
cd backend-node
npx vercel
```

### Option 2: GitHub Repository Linking
1. In the Vercel Dashboard, import your repository (`https://github.com/prateek9126/EcoCare.git`).
2. Set **Root Directory** to `backend-node`.
3. Add the `DATABASE_URL` or `POSTGRES_URL` environment variable.
4. Click **Deploy**. Vercel will compile `api/index.ts` automatically via `@vercel/node`.

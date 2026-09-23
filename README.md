# AstroHealth: Onboard Astronaut Health Monitoring & Decision-Support System
### NASA Space Apps Challenge 2026

> **Challenge:** *"Create Health Monitoring Software for Astronauts on Space Missions"*  
> **Mission Objective:** Build an onboard health monitoring and decision-support prototype for long-duration human spaceflight (e.g. Artemis lunar bases and Mars transit).

---

## 1. Project Overview

During long-duration deep space exploration, astronauts travel far beyond low Earth orbit, encountering communication latency ranging from 5 to 40 minutes, as well as periodic communication blackouts. Real-time medical telemedicine with Earth-based flight surgeons is physically impossible.

**AstroHealth** is an autonomous, onboard astronaut health monitoring and clinical decision-support system. It empowers crew members to:
* **Autonomously log daily physiological telemetry**, physical countermeasure exercise, behavioral check-ins, reported symptoms, and radiation dosimeter readings.
* **Calculate personal 14-day statistical baselines** rather than relying exclusively on generic fixed thresholds.
* **Detect multi-day cumulative trends** (such as consecutive sleep deficits or progressive vital deviations).
* **Receive immediate, deterministic decision-support alerts** with transparent rationales and mission-oriented protocol directives without needing real-time Earth connectivity.
* **Allow authorized Mission Control personnel** to monitor fleet health and review historical telemetry dossiers through a ground interface.

> [!IMPORTANT]
> **DECISION-SUPPORT ONLY — NOT A DIAGNOSTIC TOOL:**  
> This application is a telemetry monitoring and decision-support prototype, **NOT** a medical diagnosis or treatment prescription system. All alerts recommend standardized mission operational protocols rather than prescribing medical treatments.

---

## 2. Onboard Server & Autonomy Architecture

```
+-----------------------------------------------------------------------------------+
|                            SPACECRAFT ONBOARD NETWORK                             |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                 PRESENTATION LAYER (React 18 + Vite SPA)                  |   |
|   |  - React 18 Single Page Application with Vite 6 build pipeline (`client/`)|   |
|   |  - React Router v6 for zero-flicker deep-space client navigation          |   |
|   |  - AuthContext hook (`useAuth`) with JWT token storage & session handling  |   |
|   |  - React-Chartjs-2 for dynamic 14-day clinical baseline trends & radiation|   |
|   |  - Wearable IoT BLE Ingestion (WHOOP 4.0 & Fitbit Sense simulation)       |   |
|   |  - Hands-Free Web Speech API Voice Dictation with natural biometric parser|   |
|   |  - Cinematic NASA Space-to-Mars gradient & glassmorphic telemetry cards   |   |
|   +---------------------------------------------------------------------------+   |
|                                      | HTTP / REST (JSON)                         |
|                                      v                                            |
|   +---------------------------------------------------------------------------+   |
|   |                      APPLICATION LAYER (Node.js & Express)                |   |
|   |  - Single unified server on one port (Express serves static /frontend)    |   |
|   |  - Security: Helmet, CORS, Input Range Validation (express-validator)     |   |
|   |  - Auth: JWT (jsonwebtoken) + Password Hashing (bcryptjs)                  |   |
|   |  - Data Access & Security Isolation: Authenticated Astronaut Ownership    |   |
|   |                                                                           |   |
|   |  +---------------------------------------------------------------------+  |   |
|   |  |                     SERVICE & RULE ENGINE LAYER                     |  |   |
|   |  |  - Centralized Rule Evaluation Engine (Deterministic, No AI/ML)     |  |   |
|   |  |  - 14-Day Rolling Personal Baseline Calculator                      |  |   |
|   |  |  - Multi-Day Consecutive Trend Analyzer                             |  |   |
|   |  |  - Severity Aggregator & Mission-Oriented Action Generator          |  |   |
|   |  +---------------------------------------------------------------------+  |   |
|   +---------------------------------------------------------------------------+   |
|                                      | SQL (mysql2 parameterized queries)         |
|                                      v                                            |
|   +---------------------------------------------------------------------------+   |
|   |                        DATA LAYER (MySQL Database)                        |   |
|   |  - Normalized relational schema (13 tables)                               |   |
|   |  - Strict referential integrity (Foreign Keys, Unique constraints)        |   |
|   |  - health_rules catalog with configurable baseline & trend thresholds     |   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
                                       :
                                       : (Conceptual Telemetry Downlink)
                                       v
+-----------------------------------------------------------------------------------+
|                              MISSION CONTROL (Earth)                              |
|   - Views identical centralized data store through Mission Control Interface      |
|   - Real-time fleet health aggregation, alert monitoring, and trend analysis      |
+-----------------------------------------------------------------------------------+
```

### Onboard Autonomy Architecture Statement
> *"The prototype is designed around an onboard server model. The health monitoring system can operate locally without continuous internet connectivity. In this prototype, synchronization between the onboard system and Mission Control is a conceptual part of the design; Mission Control views the same database through the Mission Control interface."*

### Zero External CDN & Offline Isolation
* **Zero CDN Dependency**: Chart.js (`chart.umd.min.js`, 208 KB) is stored locally within `frontend/assets/js/`.
* **System Typography**: Employs native operating system fonts (`system-ui`, `-apple-system`, `SFMono`, `Roboto`) and custom CSS/SVG telemetry icons. Zero Google Fonts or external stylesheet CDNs.
* **Single Port / Single Server**: The Node.js Express server directly serves the static `frontend/` directory and exposes the REST APIs on a single port.
* **Simulated Communication Status Badge**: An interactive status pill (`ONLINE`, `DELAYED (12m)`, `OFFLINE`) is integrated into the shared telemetry header. All check-in, baseline evaluation, alert detection, and trend viewing functions operate seamlessly across all link states.

---

## 3. Technology Stack & Strict Constraints

This prototype strictly complies with the competition constraints:

| Component | Technology | Constraints Respected |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | **Zero frontend frameworks** (No React, Vue, Angular), zero CDNs. |
| **Charts** | Chart.js (`chart.umd.min.js`) | Bundled locally in `frontend/assets/js/`. |
| **Backend** | Node.js, Express.js | Single unified server serving frontend assets and APIs. |
| **Database** | MySQL | Normalized 3NF relational database. Parameterized queries via `mysql2`. |
| **Auth & Security** | JWT (`jsonwebtoken`), `bcryptjs`, `helmet` | Salted password hashing (rounds = 10), Bearer token RBAC. |
| **Rule Engine** | Vanilla JavaScript | **Deterministic logic only.** Zero AI, zero Machine Learning, zero Python, zero predictive black-boxes. |

### Allowed NPM Dependencies Only:
* `express`
* `mysql2`
* `bcryptjs`
* `jsonwebtoken`
* `cors`
* `dotenv`
* `express-validator`
* `helmet`

---

## 4. Rule-Based Health Evaluation & Personal Baseline

The system relies on a centralized, transparent rule engine (`backend/src/services/ruleEngineService.js`) rather than scattered client-side scripts.

### 4.1 Separation of Input Range Validation vs Health Rules
1. **Physical Range Validation**: Pre-evaluation filter in `healthController.js` that checks measured values against physically plausible bounds (e.g. heart rate [30–220 BPM], body mass [35–200 kg]). Physically impossible values (e.g. 5000 BPM) are rejected with `400 Bad Request`.
2. **Rule Engine Classification**: Classifies plausible values into `NORMAL`, `WARNING`, or `CRITICAL`.

### 4.2 14-Day Rolling Personal Baseline Math
Human physiology adapts dynamically to microgravity (e.g. cephalic fluid shifts, cardiovascular deconditioning). A fixed threshold may fail to detect individual degradation.
* **Rolling Window**: Previous 14 calendar days strictly prior to the current check-in (`target_date - 14d` to `target_date - 1d`).
* **Formula**:
  $$\text{Baseline} = \frac{1}{N} \sum_{i=1}^{N} \text{value}_i$$
  $$\text{Deviation \%} = \left(\frac{\text{Current Value} - \text{Baseline}}{\text{Baseline}}\right) \times 100$$
* **Rule Trigger**: If $|\text{Deviation \%}| \ge \text{rule.deviation\_percentage}$, flags a `WARNING` or `CRITICAL` alert (e.g. heart rate elevated $+22.2\%$ above personal baseline).

### 4.3 Multi-Day Consecutive Trend Detection
Queries preceding sequential calendar records to identify cumulative degradation:
* **Sleep Deficit Rule**: If sleep duration remains $< 6.0$ hours for **3 consecutive days**, triggers a `WARNING` alert:
  *"Sleep duration has remained below the configured monitoring level for 3 consecutive days."*
* **Exercise Deficit Rule**: If countermeasure exercise remains $< 1.0$ hour for **2 consecutive days**, flags countermeasure non-compliance.

### 4.4 Status Aggregation & Action Mapping
* If **any** indicator or trend is `CRITICAL` $\to$ Overall: `CRITICAL`
* Else if **any** is `WARNING` $\to$ Overall: `WARNING`
* Else $\to$ Overall: `NORMAL`

**Standardized Mission Protocol Actions:**
* **NORMAL**: *"Continue routine monitoring."*
* **WARNING**: *"Recheck the indicator and follow the applicable mission health protocol."*
* **CRITICAL**: *"Follow the applicable onboard emergency medical protocol. Contact Mission Control when communication is available."*
* **Critical $SpO_2$ Alert**: *"SpO₂ has fallen below the configured critical rule."*

---

## 5. Demonstration Flight Profiles & Accounts

All passwords are encrypted with `bcryptjs`. Seeded historical data provides 15 days of records up to Mission Day 21 (Artemis III, launch date 2026-09-01).

> [!NOTE]
> All accounts below are demo credentials created for testing and hackathon review.

| Role | Username | Demo Password | Crew Profile / Flight Assignment | Status |
| :--- | :--- | :--- | :--- | :--- |
| **ASTRONAUT** | `commander` | `AstroPass2026!` | AST-001: Dr. Alex Vance (Mission Commander) | **NORMAL** |
| **ASTRONAUT** | `pilot` | `AstroPass2026!` | AST-002: Elena Rostova (Flight Engineer & Pilot) | **WARNING** (3-day sleep debt + elevated HR) |
| **ASTRONAUT** | `specialist` | `AstroPass2026!` | AST-003: Marcus Chen (Science Specialist) | **CRITICAL** (Low $SpO_2$ 89% + nausea) |
| **MISSION_CONTROL** | `flight_director` | `MissionControl2026!` | Houston Flight Operations Director | **FLEET COMMAND** |

---

## 6. Demonstration Scenario Switcher

The application includes an interactive scenario switcher enabling judges to toggle flight conditions:
* `[ NORMAL SCENARIO ]`: Recalibrates all indicators to nominal levels.
* `[ WARNING SCENARIO ]`: Injects a 3-consecutive-day sleep deficit ($< 6.0$h) and $+22.2\%$ heart rate baseline deviation.
* `[ CRITICAL SCENARIO ]`: Triggers severe arterial hypoxia ($SpO_2 = 89\%$, tachycardia 104 BPM, acute nausea).

* **API Endpoint**: `POST /api/demo/scenario` (Active only when `DEMO_MODE=true`).

---

## 7. Database Architecture

The normalized MySQL schema (`astronaut_health_db`) comprises 13 relational tables:

1. **`missions`**: Spacecraft mission profiles, vessel names, launch dates, and status.
2. **`astronauts`**: Crew member rosters and operational flight roles.
3. **`users`**: Authentication credentials, bcrypt hashes, and RBAC roles (`ASTRONAUT`, `MISSION_CONTROL`).
4. **`health_indicators`**: Metric catalog with physical validation bounds (`valid_min`, `valid_max`, units).
5. **`health_records`**: Master daily telemetry log (`UNIQUE(astronaut_id, record_date)` ensuring exactly one record per date; re-submissions update the day's record).
6. **`health_record_values`**: Normalized measurements, baselines, and percentage deviations per daily record.
7. **`health_rules`**: Centralized configurable rules with demo threshold disclaimer.
8. **`alerts`**: Actionable telemetry notifications with recommended mission protocols.
9. **`symptoms_catalog`**: Predefined spaceflight symptom catalog.
10. **`record_symptoms`**: Junction table linking reported symptoms and severities to daily records.
11. **`behavioral_checkins`**: Psychological self-assessments (mood, stress, loneliness, crew connection, cognitive focus).
12. **`radiation_records`**: Simulated dosimeter tracking daily dose and cumulative mission exposure in mSv.
13. **`audit_logs`**: System security and telemetry audit trail.

---

## 8. REST API Documentation

All protected endpoints require HTTP header:  
`Authorization: Bearer <jwt_token>`

### Authentication
* `POST /api/auth/login` — Authenticates credentials, returns JWT and user profile.
* `GET /api/auth/me` — Returns current session profile.

### Astronauts
* `GET /api/astronauts/me` — Authenticated astronaut's crew profile and mission day.
* `GET /api/astronauts/:id` — Astronaut profile (guarded by ownership or Mission Control role).

### Health Telemetry
* `POST /api/health` — Submits or updates daily check-in (validates bounds, triggers rule engine, updates baselines, logs alerts).
* `GET /api/health/:astronautId/latest` — Latest evaluated telemetry record with active alerts.
* `GET /api/health/:astronautId/history?filter=today|7d|14d|30d` — Historical telemetry data table.
* `GET /api/health/:astronautId/trends?days=14` — Formatted time-series datasets for local Chart.js.

### Alerts
* `GET /api/alerts/:astronautId?status=all|unread` — Filterable alert inbox.
* `PATCH /api/alerts/:id/read` — Acknowledges an alert with an onboard timestamp.

### Mission Control (Role: `MISSION_CONTROL`)
* `GET /api/mission-control/astronauts` — Fleet-wide roster with health statuses and alert counts.
* `GET /api/mission-control/astronauts/:id/health` — In-depth astronaut telemetry drill-down.
* `GET /api/mission-control/alerts` — Fleet-wide active alert queue.

### NASA Research & Demo
* `GET /api/research` — NASA's 5 Hazards, Twins Study, OSDR, and verified URLs.
* `POST /api/demo/scenario` — Regenerates 15-day simulation scenario (`DEMO_MODE=true` required).

---

## 9. NASA Research & The Five Human Spaceflight Hazards

The application links each monitoring module directly to NASA Human Research Program literature:

| Hazard | Physiological / Psychological Impact | Application Monitoring Feature |
| :--- | :--- | :--- |
| **1. Space Radiation** | Galactic Cosmic Rays (GCR) and Solar Particle Events (SPE) cause cellular and DNA damage. | **Radiation Dosimeter**: Daily and cumulative mission exposure (mSv). |
| **2. Isolation & Confinement** | Confinement in small habitats causes circadian disruption, sleep latency, and interpersonal friction. | **Behavioral Surveillance**: Mood, stress, loneliness, and crew cohesion check-ins. |
| **3. Distance from Earth** | Communication latency (5–40 min) prevents real-time telemedicine with flight surgeons. | **Onboard Autonomy**: Autonomous rule engine and personal baselines operating offline. |
| **4. Gravity Fields** | Microgravity unloads bone and muscle, causing rapid deconditioning and cephalic fluid shift. | **Countermeasures**: Daily exercise duration tracking and multi-day trend compliance. |
| **5. Hostile / Closed Environments** | Closed life support loops, elevated $CO_2$, and toxic micro-constituents trigger symptoms. | **Physiological Vitals & Symptoms**: Continuous $SpO_2$, heart rate, BP, temp, and symptom checklists. |

### Verified Official NASA Citations:
* [NASA Human Research Program (HRP)](https://www.nasa.gov/hrp)
* [NASA Twins Study Results](https://www.nasa.gov/twins-study)
* [NASA Open Science Data Repository (OSDR)](https://osdr.nasa.gov)
* [Official NASA Agency Portal](https://www.nasa.gov)

---

## 10. Step-by-Step Installation & Run Guide

### Prerequisites
* **Node.js** (v18.0.0 or later)
* **npm** (v9.0.0 or later)
* **MySQL Server** (v8.0 or later, installed and running locally)

### Step 1: Clone or Navigate to Project
```bash
cd /Users/apple/.gemini/antigravity/scratch/astronaut-health-monitor
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 3: Install & Build React Client
```bash
cd ../client
npm install
npm run build
```

### Step 4: Configure Environment Variables
Verify or edit `backend/.env`:
```ini
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=astronaut_health_db
DB_PORT=3306
JWT_SECRET=nasa_space_apps_2026_super_secret_jwt_key_987654321
JWT_EXPIRES_IN=24h
DEMO_MODE=true
```

### Step 5: Seed Database & Generate 15 Days of Telemetry
Make sure your local MySQL server is running, then run:
```bash
# From project root:
npm run seed

# Or from backend:
node ../database/seed.js
```
*This automatically creates `astronaut_health_db`, applies `database/schema.sql` (all 13 tables), hashes passwords using `bcryptjs`, and populates 15 days of historical telemetry.*

### Step 6: Start the Spacecraft Onboard Server
```bash
# From project root:
npm start

# Or from backend:
node server.js
```
The unified server will start on: **`http://localhost:3000`** (serving the compiled React SPA).

### Step 7 (Optional): Fast Vite Development Mode
For instant Hot Module Replacement (HMR) during frontend development:
```bash
npm run client:dev
```
*Runs Vite dev server at `http://localhost:5173` with automated API proxying to `http://localhost:3000`.*

### Step 8: Access the Application
Open your browser and navigate to:
**`http://localhost:3000`**

Log in using your astronaut name / call sign (e.g. `sajid`, `Alex Vance`), select your mission role (e.g., `Astronaut`, `Mission Commander`), and enter the simulation passcode (`password`).

---

## 11. Verification & Automated Test Suites

Run the built-in diagnostic test suites:

```bash
cd backend

# 1. Test Authentication, JWT & Role Middleware
node test-auth.js

# 2. Test Rule Engine, Personal Baseline Math & Multi-Day Trends
node test-rule-engine.js

# 3. Test REST API Controllers & Input Range Validation
node test-step4-api.js
```

---

## 12. Disclaimers

> [!CAUTION]
> **SIMULATED DEMONSTRATION DATA:**  
> The health values displayed in this prototype are simulated data for demonstration purposes. The monitored health indicators and health considerations are informed by NASA's human spaceflight research.

> [!WARNING]
> **ILLUSTRATIVE THRESHOLDS:**  
> All numerical threshold values configured in this prototype are illustrative demonstration parameters. They are **NOT** official NASA medical limits or diagnostic standards.

> [!NOTE]
> **DECISION-SUPPORT SYSTEM:**  
> This software is an onboard telemetry monitoring and decision-support prototype, **NOT** a medical diagnosis or treatment prescribing system.

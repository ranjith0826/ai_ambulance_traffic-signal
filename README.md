# LifeLane AI — Intelligent Ambulance Priority & Virtual Traffic Management

> **Software-Only Prototype**: This project coordinates emergency vehicles, traffic signal preemption, multi-ambulance intersection conflicts, trauma hospital recommendation, and live command dispatch 
---

## 🎨 Design Theme (Cream Palette)
- **Background**: `#F7F1E3`
- **Card / Surface**: `#FFFDF7`
- **Primary Green**: `#245C45`
- **Dark Green**: `#163D2F`
- **Gold**: `#C99A3D`
- **Orange**: `#D9822B`
- **Danger**: `#B94A48`
- **Success**: `#3D7A57`
- **Text**: `#292722`
- **Muted Text**: `#777064`
- **Border**: `#E6DCC8`

---

## 🚀 Key Innovations

1. **Multi-Ambulance Conflict Resolution (The Core Innovation)**:
   - Evaluates multiple ambulances approaching an intersection within a 30-second conflict window.
   - Calculates Priority Score:
     $$\text{Priority Score} = (\text{Severity} \times 0.40) + (\text{ETA Urgency} \times 0.30) + (\text{Distance Urgency} \times 0.20) + (\text{Hospital Urgency} \times 0.10)$$
   - Resolves cross-directional collisions (North-to-South vs East-to-West) by granting `EMERGENCY GREEN` to higher priority vehicle, commanding `HOLD` (Red) to the other, and automatically handing over green right after primary clearance.

2. **500m Green Corridor Geofence**:
   - Automatically preempts signals along the route when an ambulance is within 500 meters.
   - Reverts signal cycle to normal once vehicle clears the intersection.

3. **Smart Hospital Recommendation**:
   - Ranks hospitals by emergency/ICU bed capacity, on-call specialists (Cardiology, Neurology, Trauma), and real-time proximity.

4. **What-If Comparative Impact Engine**:
   - Measures simulated time saved and signal delay reduction with vs without LifeLane AI.

---

## 👥 Stakeholder Roles & Preloaded Credentials

| Role | Email | Password | Access / Dashboard |
|---|---|---|---|
| **System Administrator** | `admin@lifelane.ai` | `Admin@123456` | `/admin` (Manage Users, Fleet, Signals, Audit Logs) |
| **Ambulance Driver** | `driver@lifelane.ai` | `Driver@123456` | `/driver` (GPS / Simulation, Hospital Finder, Speedometer) |
| **Traffic Control Officer** | `officer@lifelane.ai` | `Officer@123456` | `/traffic` (Command Map, Signal Roster, Manual Override) |
| **Hospital Administrator** | `hospital@lifelane.ai` | `Hospital@123456` | `/hospital` (Bed/ICU/Ventilator Capacity & Patient Triage) |

*Note: New users can also register freely on `/register` with role-specific profile fields.*

---

## 💻 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS (Cream theme), Leaflet + OpenStreetMap, Recharts, Socket.IO Client, Lucide React, jsPDF.
- **Backend**: Python 3.13, FastAPI, Motor / PyMongo, Python-SocketIO, Pydantic v2, PyJWT, Bcrypt, Boto3.
- **Database**: MongoDB (Local, Atlas, or Amazon DocumentDB).
- **AWS Cloud Services**:
  - **Amazon Bedrock**: GenAI Clinical Copilot & Trauma Triage (`anthropic.claude-3-5-sonnet` / `amazon.titan-text`).
  - **Amazon S3**: Incident Analytics & Telemetry Post-Mortem Audit Archive.
  - **Amazon EC2 / DocumentDB**: Microservices container hosting & persistence.
  - **Amazon SNS**: Send message to hospital when ambulance is in activation mode

---

## ☁️ AWS Cloud Architecture

### 1. Features used in  AWS Account

| Service | Feature in LifeLane AI | What to Show in AWS Console |
|---|---|---|
| **Amazon Bedrock** | **GenAI Pre-Arrival Clinical Triage**: Evaluates patient vitals (ECG, SpO2, GCS, BP) to activate Cardiac Cath Lab or Level-1 Trauma Bay and advise paramedics. | Open **Amazon Bedrock $\rightarrow$ Model Access** (show Claude 3.5 Sonnet / Titan enabled) and **Bedrock Playgrounds** for test inference. |
| **Amazon S3** | **Emergency Audit & Telemetry Vault**: Stores immutable PDF incident reports and dispatch logs with AES-256 server-side encryption. | Open **S3 $\rightarrow$ Buckets $\rightarrow$ `lifelane-ambulance-reports`** to show uploaded PDF audit reports with timestamps. |
| **Amazon EC2 / Lightsail** | **Microservice Hosting**: Containerized FastAPI socket daemon and Vite React command dashboard. | Open **EC2 $\rightarrow$ Instances** to show running Docker host and Security Groups. |
| **Amazon DocumentDB** | **NoSQL Telemetry Database**: MongoDB-compatible storage for signal states, fleet GPS coordinates, and hospital bed availability. | Open **Amazon DocumentDB $\rightarrow$ Clusters**. |
| **Amazon SNS** : SNS is used to send notifications to the hospital that the ambulance driver selects as the destination.
### 2. Live Demo Steps

1. **Dashboard API & Cloud Settings**:
   - In the top navigation bar, click the **Settings / Key** icon.
   - Click the **AWS Bedrock & S3** tab.
   - Click **"Test AWS Live"** to show real-time connection verification.
2. **Amazon Bedrock Clinical Copilot**:
   - Navigate to `/hospital` (Hospital Emergency Portal).
   - Click the **"AWS BEDROCK AI COPILOT"** or **"Bedrock AI Triage"** button on an incoming patient.
   - the instant LLM clinical reasoning: triage priority score, emergency paramedic interventions, and trauma resuscitation bay preparation checklist.
3. **Amazon S3 Regulatory Archival**:
   - Navigate to `/analytics` (Operational Intelligence Dashboard).
   - Click **"Upload to Amazon S3"**.

---

## 🛠️ Quick Start Guide

### 1. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python seed_data.py
uvicorn app.main:asgi_app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```


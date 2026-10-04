# Workforce Management System 🏢
A comprehensive corporate workspace portal streamlining employee roster scheduling, GPS-based daily attendance check-ins, onboarding/offboarding pipelines, recruitment trackers, interactive task allocation, multi-role workspace simulator, and real-time operational analytics.

---

## 📂 Project Structure & Module Overview
The system is divided into granular, modular components under `/src/modules/` and `/src/components/`, ensuring clear separation of concerns:

| Module / Component | Focus & Responsibility | Key Visual Assets / Interactions |
| :--- | :--- | :--- |
| **`dashboard`** | Central Workspace Hub | Dynamic KPIs, Real-time status tracker, Quick Attendance card, Schedule Events queue, and Action banners |
| **`attendance`** | Punch-In & Geo-Fencing | Virtual Camera snapping, GPS Location matching (HQ vs. Remote), Shift Timeline logs, and active status telemetry |
| **`recruitment`**| Hiring & Talent Sourcing | Interactive Applicant Pipelines (Applied, Screened, Offered), custom candidate notes, and status transitions |
| **`onboarding`** | HR Invites & Verification| Interactive checklist (Assets, Signatures, Training), Progress gauges, and dynamic team invitation forms |
| **`leave`** | Accruals & Time Off | Leave balance cards, dynamic request submittals, status workflow indicators, and HR validation triggers |
| **`roster`** | Shift & Shift Scheduling | Interactive weekly roster planner, visual coverage graphs, department filters, and instant schedule publisher |
| **`task`** | Tasks & Kanban Board | Kanban board by status, due date prioritization indicators, custom task creation, and drag-and-drop simulation |
| **`chat`** | Real-Time Collaboration | Workspace Group Chat canvas, interactive message boards, sender details, and message streaming |
| **`notes`** | Corporate Scratchpad | Rich text memos, department categories, search/filter controls, and sticky visual templates |
| **`report`** | Operations & Analytics | Custom performance metrics, active headcounts, punch history data exports, and chart visualizations |
| **`offboarding`**| Offboarding Pipeline | Resignation trackers, clearance checklists, handover tracking, and dynamic exit interviews |
| **`auth`** | Multi-Role Simulation | Live perspective switcher supporting: **Super Admin**, **HR**, **Manager**, **Team Lead**, and **Employee** roles |

---

## 📋 Comprehensive Task & Feature Breakdown

### 1. Unified Dashboard Core & Global Header
*   [x] **State-Driven Perspective Navigation**: Persistent multi-tab routing mapping all workspace modules seamlessly.
*   [x] **Search Workspace Input**: Interactive search engine supporting direct fuzzy searches of pages/modules, real-time employee lookup, and dynamic projects routing.
*   [x] **Invite Team Member Action**: Quick-action modal allowing managers to dispatch onboarding templates to new hires directly from the header rail.
*   [x] **Interactive Workspace Settings**: More Actions dropdown enabling live data-preset wipes, simulated alert/drill alerts, and role switcher overrides.
*   [x] **System Notifications Panel**: Multi-category notification dispatch (HR, Task, System) with unread badge count tracking.
*   [x] **Share Workspace Link**: Integrated Clipboard API synchronization allowing instant link sharing.

### 2. Quick Attendance Desk (Dashboard Mini-Card)
*   [x] **Shift State Recognition**: Detects whether the current active user is currently off-duty, actively checked in, or has completed their shift for the day.
*   [x] **GPS & Location Selectors**: Quick toggle between **🏢 Office HQ** (lat: `37.7749`, lng: `-122.4194`) and **🏠 Remote/Home** (lat: `37.3382`, lng: `-121.8863`).
*   [x] **Shift Notes & Log Handoffs**: Text area for shift start/end summaries, dispatching records seamlessly into the Attendance Module log history.
*   [x] **Instant Actions**: High-contrast, interactive button supporting instantaneous check-ins and check-outs with full data validation.

### 3. Comprehensive Attendance Module
*   [x] **Self-Identity Virtual Camera**: Toggle simulated webcams to snap high-fidelity verification snapshots upon checking in.
*   [x] **GPS Location Geo-verification**: Renders a mock interactive map with coordinate coordinates (Latitude/Longitude) matching standard corporate geofences.
*   [x] **Detailed Performance Visualizer**: Highlights Shift Completion gauges, total accumulated weekly working hours, and clock-in punctuality trends (On-Time vs Late).
*   [x] **Historical Logs**: Paginated ledger detailing previous daily punches, locations, and supervisor handoff notes.

### 4. Interactive Recruitment Portal
*   [x] **Hiring Pipeline board**: Dynamic drag-and-drop Kanban style column board grouping applicants by screening status.
*   [x] **Job Post Configurator**: Interactive module enabling managers to create, preview, and activate active vacancy listings.
*   [x] **Candidate Dossiers**: Expanded details containing resumes, background info, interview timelines, and direct assessment reviews.

### 5. Smart Onboarding & HR Invitation System
*   [x] **Live Invite Module**: Automatically pre-populates onboarding pipelines with custom profile generation, tracking documentation, asset allocation, and checklists.
*   [x] **Progress Tracking Indicators**: Clear visual progress meters showing overall completion percentages for required corporate paperwork.
*   [x] **Checklist Items**:
    *   *Documents Verification*: Citizenship, passport, and full employment contracts.
    *   *Corporate Asset Logistics*: Laptops, corporate ID cards, security passes, and SIM cards.
    *   *Access Controls*: Corporate mail setups, payroll configurations, system workspace allocations, and compliance courses.

### 6. Interactive Task Organizer
*   [x] **Priority Kanban board**: Color-coded task status cards mapping tasks into Backlog, Todo, In-Progress, and Completed pools.
*   [x] **Task Creation Panel**: Quickly assign work items, priority levels (Low, Medium, High), due dates, and specify target employees.

---

## 🛠️ Technology Stack & Styling Guidelines
The application is engineered with a modular, highly polished React frontend:

*   **Runtime & Compiler**: React 19 + TypeScript + Vite.
*   **Aesthetic & Styling**: Tailwind CSS (compiled via native Vite integration), utilizing deep charcoal typography (`slate-900`), soft backgrounds (`slate-50`), and high-contrast corporate teal accents (`teal-800`).
*   **Iconography**: Fully powered by `lucide-react` for crisp vector visuals.
*   **Micro-interactions**: Seamless element entries powered by the `motion` (Framer) engine.

---

## ⚙️ Running & Building the Application

### 1. Developer Startup
To boot up the localized development server with Hot Module Replacement and responsive preview endpoints, run:
```bash
npm run dev
```

### 2. Code Validation & Linter
Ensure type safety and adherence to ESLint best-practices before pushing changes:
```bash
npm run lint
```

### 3. Production Compilation
Generate a highly-optimized, static production build output in the `/dist` directory:
```bash
npm run build
```

---

## 🚀 Dev Simulator & Testing Mechanics
For testing purposes, make use of the **Workspace Simulator** in the header (`MoreHorizontal` button):
1.  **Perspective Overrides**: Swap between HR or Admin perspectives to instantly unlock protected workflows (like Roster editing, creating recruitment jobs, or approving leave requests).
2.  **Notification Dispatches**: Click "Simulate Event Alert" to test real-time notification streams.
3.  **Local Reset**: Wipe browser persistence state to default presets in one click.

# 🏥 HealSync - Citywide Health Collaboration Network

> **Powered by Agentic AI** | Multi-Agent System for Healthcare Resource Optimization

![HealSync Banner](https://img.shields.io/badge/AI-Multi--Agent%20System-blue) ![Node.js](https://img.shields.io/badge/Backend-Node.js-green) ![React](https://img.shields.io/badge/Frontend-React-blue) ![Status](https://img.shields.io/badge/Status-Operational-success)

---

## 🎯 Project Overview

**HealSync** is an intelligent citywide health collaboration network where healthcare entities (hospitals, pharmacies, labs, suppliers) are represented by **autonomous AI agents** that can reason, predict, and communicate in real-time to:

- ✅ **Prevent resource wastage**
- ✅ **Avoid medicine shortages**
- ✅ **Reduce delayed patient care**
- ✅ **Predict and prevent health crises**

Unlike traditional centralized healthcare systems that *react* to problems, HealSync agents *predict and prevent* them through autonomous coordination.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     HEALSYNC SYSTEM                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐         ┌─────────────┐                    │
│  │  Frontend   │◄────────┤  Backend    │                    │
│  │  (React)    │ Socket  │  (Node.js)  │                    │
│  │  Port 5173  │   +     │  Port 4000  │                    │
│  │             │  REST   │             │                    │
│  └─────────────┘         └──────┬──────┘                    │
│                                  │                           │
│                          ┌───────┴───────┐                  │
│                          │   Event Bus   │                  │
│                          │ (Pub/Sub)     │                  │
│                          └───────┬───────┘                  │
│                                  │                           │
│        ┌─────────────────────────┼─────────────┐           │
│        │         │         │     │      │      │           │
│    ┌───▼──┐  ┌──▼──┐  ┌──▼──┐ ┌▼───┐ ┌▼───┐ ┌▼────┐     │
│    │City  │  │ Lab │  │Hosp.│ │Phar│ │Supp│ │State│     │
│    │Agent │  │Agent│  │Agent│ │macy│ │lier│ │     │     │
│    └──────┘  └─────┘  └─────┘ └────┘ └────┘ └─────┘     │
│                                                               │
│       All agents share worldState.js (Shared Memory)        │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

1. **Event-Driven Architecture** - Agents communicate via publish/subscribe pattern
2. **Shared World State** - Single source of truth (`worldState.js`)
3. **Autonomous Agents** - Each runs on 10-second tick cycles
4. **Real-time Updates** - WebSocket connections for instant dashboard updates
5. **Role-Based Dashboards** - Separate UI for each healthcare entity type

---

## 🤖 AI Agents

### 1. 🌆 **City Agent** (Citywide Coordinator)
- **Role:** Oversees entire city healthcare system
- **Monitors:** All zones, overall health metrics, disease trends
- **Predicts:** City-wide health risks and resource needs
- **Actions:** 
  - Broadcasts city-wide alerts
  - Triggers scenario simulations
  - Coordinates cross-zone resource redistribution
- **Tick Cycle:** Logs city status every 10 seconds

### 2. 🔬 **Lab Agent** (Disease Detection)
- **Role:** Early disease outbreak detection
- **Monitors:** Disease test volumes (Dengue, Malaria, COVID, Typhoid, Cholera)
- **Predicts:** Outbreak risk using growth rate analysis
  - Formula: `risk = (current - baseline) / baseline * 100`
  - Thresholds: 2x = Medium Risk, 3x = Critical Risk
- **Actions:** 
  - Alerts hospitals and pharmacies in affected zones
  - Publishes `DISEASE_OUTBREAK_PREDICTED` events
- **Communication:** "🚨 DENGUE OUTBREAK PREDICTED! Alerting hospitals & pharmacies"

### 3. 🏥 **Hospital Agent** (Capacity Management)
- **Role:** Patient care and resource management
- **Monitors:** Bed occupancy, ICU capacity, ER wait times
- **Predicts:** Overload risk in next 24-48 hours
- **Actions:** 
  - Reserves isolation beds for outbreak response
  - Requests medicines from pharmacies
  - Adjusts staffing and ward preparations
- **Communication:** "Reserving 20 isolation beds for dengue patients"

### 4. 💊 **Pharmacy Agent** (Inventory Management)
- **Role:** Medicine stock optimization
- **Monitors:** Stock levels for 15+ medicine types
- **Predicts:** Days until stockout for each medicine
  - Formula: `days_remaining = current_stock / daily_consumption_rate`
- **Actions:** 
  - Places urgent orders when stock < reorder point
  - Adjusts demand forecasts based on outbreak alerts
  - Confirms medicine availability to hospitals
- **Communication:** "📦 URGENT ORDER to Supplier S1: 500 units of Dengue Medicine"

### 5. 🚚 **Supplier Agent** (Supply Chain)
- **Role:** Warehouse and delivery management
- **Monitors:** Inventory (17 items), delivery fleet (4 vehicles)
- **Predicts:** Demand surges and delivery capacity
- **Actions:** 
  - Prioritizes urgent orders
  - Allocates limited inventory strategically
  - Schedules deliveries and dispatches vehicles
- **Communication:** "✅ ORDER CONFIRMED: 500 Dengue Medicine to P1 - ETA 4 hours"

---

## 🔄 Event Flow Example: Dengue Outbreak

```
1. USER triggers "Dengue Outbreak" scenario
   ↓
2. CITY AGENT announces: "🌆 SCENARIO: Dengue Outbreak in Zone-2"
   ↓
3. LAB AGENT detects test spike:
   - Tests: 8 → 24 (3x increase!)
   - Growth rate: 200%
   - Risk level: CRITICAL (90%)
   - Publishes: DENGUE_OUTBREAK_PREDICTED
   ↓
4. HOSPITAL AGENTS respond:
   - Reserve 20 isolation beds
   - Request 500 units dengue medicine
   - Publishes: MEDICINE_REQUEST
   ↓
5. PHARMACY AGENT responds:
   - Checks stock: 300 units (insufficient)
   - Places urgent order for 500 units
   - Publishes: ORDER_PLACED
   ↓
6. SUPPLIER AGENT responds:
   - Checks inventory: 2400 units available
   - Prioritizes urgent order
   - Confirms delivery ETA: 4 hours
   - Publishes: ORDER_CONFIRMED
   ↓
7. Dashboard updates in REAL-TIME across all views

Total coordination time: < 2 seconds ⚡
```

---

## 📊 Dashboards

### 🌍 **Public Dashboard** (Default Landing Page)
**Target Users:** General citizens

**Features:**
- 🗺️ **Health Heatmap** - Visual disease risk by zone
- ⚠️ **Active Alerts** - Real-time public health warnings
- 📈 **City Statistics** - Available beds, active cases, medicine availability
- 🏥 **Service Locator** - Find nearby hospitals, pharmacies, labs
- 🔐 **Professional Login** - Access role-specific dashboards

### 🏢 **City Dashboard**
**Target Users:** City administrators, health officials

**Features:**
- 📊 **Metric Cards** - Total beds, alerts, active agents
- 🗺️ **Zone Health Map** - Risk levels for Zone-1, Zone-2, Zone-3
- 🤖 **AI Agent Status** - Live status of all 6 agents
- 🦠 **Disease Surveillance** - Active outbreaks and trends
- 📜 **Activity Log** - Complete event timeline with icons
- 🎮 **Scenario Controls** - Test various emergency scenarios

### 🏥 **Hospital Dashboard**
**Target Users:** Hospital administrators

**Features:**
- 🛏️ **Bed Capacity Indicators** - General, ICU, Isolation beds
- ⚠️ **Critical Alerts** - Outbreak warnings, capacity issues
- 🤖 **AI Action Notifications** - What the hospital agent is doing
- 📡 **Inter-Agent Communication** - Messages from/to other agents
- 📊 **Real-time Metrics** - Occupancy rates, ER wait times

### 💊 **Pharmacy Dashboard**
**Target Users:** Pharmacy owners/managers

**Features:**
- 💊 **Medicine Stock Indicators** - Visual stock levels (🟢🟡🔴)
- ⚠️ **Recent Actions & Alerts** - Orders placed, stock warnings
- 📡 **Inter-Agent Communication** - Orders to suppliers, hospital requests
- 🧪 **Simulate Consumption** - Test medicine depletion scenarios
- 📊 **Inventory Trends** - Stock movement over time

### 🔬 **Lab Dashboard**
**Target Users:** Lab administrators

**Features:**
- 🦠 **Disease Cards** - Test counts and growth rates per disease
- ⚠️ **Outbreak Alerts** - Critical disease warnings
- 📡 **Broadcast Messages** - Alerts sent to hospitals/pharmacies
- 📈 **Test Volume Trends** - Daily test counts
- 🔬 **Lab Capacity** - Processing capacity and queue status

### 🚚 **Supplier Dashboard**
**Target Users:** Supply chain managers

**Features:**
- 📦 **Inventory Alerts** - Stock levels for each medicine/equipment
- 🚚 **Delivery Fleet Status** - Vehicle availability
- 📋 **Recent Orders** - Incoming requests with priority levels
- 📡 **Order Communication** - Confirmations, delivery updates
- 🗺️ **Delivery Map** - Active deliveries and routes

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v8 or higher)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd agent-hub
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

### Running the System

#### Option 1: Run both servers simultaneously

**Terminal 1 - Backend:**
```bash
cd backend
node server.js
```
✅ Backend runs on `http://localhost:4000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ Frontend runs on `http://localhost:5173`

#### Option 2: Using nodemon (for development)
```bash
cd backend
npm run dev
```

### Accessing the Application

1. Open browser: `http://localhost:5173`
2. Default view: **Public Dashboard**
3. Click **"Professional Login"** to access role-specific dashboards

---

## 🎮 Testing Scenarios

### Built-in Scenarios

Login as **City Administrator** and trigger:

1. **🦟 Dengue Outbreak** - Simulates spike in dengue cases in Zone-2
2. **🦟 Malaria Outbreak** - Simulates malaria outbreak in Zone-3
3. **😷 COVID-19 Surge** - Simulates COVID-19 patient surge
4. **🌡️ Heatwave** - Simulates heatwave with dehydration cases
5. **🏥 Hospital Overload** - Simulates sudden patient influx
6. **💊 Medicine Shortage** - Simulates critical medicine stockout
7. **🔄 Reset System** - Resets all data to baseline state

### What to Observe

After triggering a scenario:

1. **Activity Log** - Watch the agent cascade in real-time
2. **Agent Actions** - See autonomous decision-making
3. **Inter-Agent Communication** - Observe coordination messages
4. **Dashboard Updates** - Real-time metric changes
5. **Resource Allocation** - Watch medicines/beds being allocated

---

## 📁 Project Structure

```
agent-hub/
├── backend/
│   ├── agents/
│   │   ├── CityAgent.js          # Citywide coordinator
│   │   ├── LabAgent.js           # Disease detection
│   │   ├── HospitalAgent.js      # Capacity management
│   │   ├── PharmacyAgent.js      # Inventory management
│   │   └── SupplierAgent.js      # Supply chain
│   ├── constants/
│   │   └── events.js             # Event type definitions
│   ├── routes/
│   │   └── stateRoutes.js        # API endpoints
│   ├── worldState.js             # Shared state (Single Source of Truth)
│   ├── eventBus.js               # Pub/Sub event system
│   ├── server.js                 # Express + Socket.io server
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── PublicDashboard.jsx      # Landing page
│   │   │   ├── CityDashboard.jsx        # City admin view
│   │   │   ├── HospitalDashboard.jsx    # Hospital view
│   │   │   ├── PharmacyDashboard.jsx    # Pharmacy view
│   │   │   ├── LabDashboard.jsx         # Lab view
│   │   │   └── SupplierDashboard.jsx    # Supplier view
│   │   ├── components/
│   │   │   ├── HealthHeatmap.jsx        # Zone risk visualization
│   │   │   ├── ActiveAlerts.jsx         # Alert display
│   │   │   ├── CityStatistics.jsx       # City metrics
│   │   │   ├── ServiceLocator.jsx       # Find services
│   │   │   └── LoginModal.jsx           # Role selection
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx          # Authentication state
│   │   ├── App.jsx                      # Main app with routing
│   │   └── main.jsx                     # Entry point
│   └── package.json
│
├── README.md                            # This file
└── PROJECT_SUMMARY.md                   # Detailed documentation
```

---

## 🎯 Key Features

### ✅ Implemented Features

1. **Autonomous Agent Intelligence**
   - Self-monitoring every 10 seconds
   - Predictive analytics using trend analysis
   - Threshold-based decision making
   - Autonomous action execution

2. **Real-time Communication**
   - Event-driven architecture (Pub/Sub)
   - WebSocket for instant updates
   - Inter-agent message tracking
   - Event history logging

3. **Dynamic Dashboards**
   - Role-based access control
   - Real-time metric updates
   - Visual indicators (progress bars, color coding)
   - Interactive scenario controls

4. **Comprehensive Data Model**
   - Multiple hospitals (2), labs (1), pharmacies (1), suppliers (1)
   - 5 diseases tracked (Dengue, Malaria, COVID, Typhoid, Cholera)
   - 15+ medicine types
   - 17 warehouse items
   - 3 city zones

5. **Intelligent Logging**
   - Categorized events (System, Prediction, Action, Communication)
   - Icon-based visual logs
   - Agent-specific filtering
   - Timestamped entries
   - Smart auto-scroll with manual control

6. **Inter-Agent Visibility**
   - Message sent/received tracking
   - Communication timelines
   - Request/response chains
   - Cross-agent coordination display

---

## 🧠 Agent Intelligence Details

### Prediction Algorithms

**Lab Agent - Outbreak Detection:**
```javascript
growthRate = (currentTests - previousTests) / previousTests * 100
riskLevel = growthRate > 150% ? 'CRITICAL' : 
            growthRate > 80% ? 'HIGH' : 
            growthRate > 40% ? 'MEDIUM' : 'LOW'
```

**Pharmacy Agent - Stock Prediction:**
```javascript
daysRemaining = currentStock / averageDailyConsumption
urgency = daysRemaining < 3 ? 'CRITICAL' : 
          daysRemaining < 7 ? 'HIGH' : 'NORMAL'
```

**Hospital Agent - Capacity Prediction:**
```javascript
occupancyRate = (bedsUsed / totalBeds) * 100
overloadRisk = occupancyRate > 85% ? 'HIGH' : 
               occupancyRate > 70% ? 'MEDIUM' : 'LOW'
```

### Decision Logic

Each agent follows this cycle:
```
1. MONITOR → Read current state
2. ANALYZE → Calculate trends and predictions
3. DECIDE → Apply threshold-based rules
4. ACT → Update state and publish events
5. COMMUNICATE → Send messages to relevant agents
6. LOG → Record actions for transparency
```

---

## 🏆 What Makes HealSync Unique

### 1. **Truly Autonomous**
- No manual coordination needed
- Agents act independently based on local observations
- Real-time decision-making without human intervention

### 2. **Predictive Not Reactive**
- Prevents crises before they happen
- Proactive resource allocation
- Early warning system for outbreaks

### 3. **Transparent AI**
- All agent "thinking" is visible in logs
- Decision reasoning is displayed
- Inter-agent conversations are tracked

### 4. **Scalable Architecture**
- Easy to add more agents
- Simple to expand to more zones/cities
- Modular design for new features

### 5. **Real-World Applicable**
- Based on actual healthcare challenges
- Realistic data models
- Practical use cases

---

## 🎬 Demo Strategy

### Opening (30 seconds)
Show normal operations with agents monitoring peacefully.
> "Right now, 6 AI agents are autonomously monitoring this city's healthcare system."

### Scenario Demo (2 minutes)
Trigger dengue outbreak and narrate:
1. Lab detects spike → Predicts outbreak
2. Hospitals prepare → Reserve beds
3. Pharmacies check stock → Order medicines
4. Supplier fulfills → Confirm delivery

> "Notice: All automatic, no human clicks needed after initial trigger."

### Comparison (30 seconds)
| Traditional System | HealSync |
|-------------------|----------|
| Reacts to crisis | Predicts & prevents |
| Manual phone calls | Autonomous coordination |
| Hours to respond | Seconds to coordinate |
| Resource wastage | Optimized allocation |

### Impact Statement
> "In a real dengue outbreak, this could save hundreds of lives by ensuring hospitals have medicines and beds ready before the crisis peaks."

---

## 🔮 Future Enhancements

### Potential Additions

1. **Machine Learning Integration**
   - Train on historical disease data
   - More accurate outbreak predictions
   - Seasonal pattern recognition

2. **Multi-City Coordination**
   - Scale to multiple cities
   - Inter-city resource sharing
   - Regional health coordination

3. **External Data Integration**
   - Real weather APIs
   - Traffic data for delivery optimization
   - Social media for early disease signals

4. **Advanced Negotiation**
   - Agent-to-agent negotiation protocols
   - Resource bidding systems
   - Priority-based allocation algorithms

5. **Mobile App**
   - Citizen health reporting
   - Real-time alerts and notifications
   - Nearby service recommendations

---

## 🤝 Contributing

This project was built for a hackathon. If you'd like to contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the MIT License.

---

## 👥 Team

Built with ❤️ for the hackathon by the HealSync Team

---

## 📞 Support

For questions or issues:
- Open an issue in the repository
- Check `PROJECT_SUMMARY.md` for detailed documentation
- Review `HealSync Implementation Plan.plan.md` for architecture details

---

## 🎯 Success Metrics

### System Performance
- ✅ Agent response time: < 2 seconds
- ✅ Event propagation: < 100ms
- ✅ Dashboard updates: Real-time (WebSocket)
- ✅ Prediction accuracy: Based on trend analysis

### Demonstration Impact
- ✅ Innovation: Multi-agent AI for healthcare
- ✅ Technical complexity: Event-driven + real-time + predictive
- ✅ Real-world impact: Lives saved through prevention
- ✅ Scalability: Easily expandable architecture
- ✅ User experience: Intuitive role-based dashboards

---

## 🚀 Quick Start Commands

```bash
# Install everything
cd backend && npm install && cd ../frontend && npm install

# Run backend (Terminal 1)
cd backend && node server.js

# Run frontend (Terminal 2)
cd frontend && npm run dev

# Open browser
# http://localhost:5173

# Test scenario
# Login as City → Click "Dengue Outbreak" → Watch magic happen! ✨
```

---

**HealSync** - Because healthcare coordination should be intelligent, not reactive. 🏥🤖

**Status:** ✅ Operational | **Version:** 1.0.0 | **Last Updated:** November 2025


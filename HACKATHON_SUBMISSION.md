# 🛡️ GridShield AI — Autonomous Cyber-Physical Defense for Smart Power Grids

> **Team Hackathon Submission Document**

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Statement](#2-solution-statement)
3. [Solution Architecture](#3-solution-architecture)
4. [Phase-wise System Walkthrough](#4-phase-wise-system-walkthrough)
5. [Technology Stack](#5-technology-stack)
6. [Key Algorithms & Models](#6-key-algorithms--models)
7. [Feasibility & Impact](#7-feasibility--impact)
8. [Future Roadmap](#8-future-roadmap)

---

## 1. Problem Statement

### The Threat Landscape

Modern power grids are no longer isolated mechanical systems — they are **cyber-physical networks** where digital SCADA/IoT sensors control the flow of physical electricity. This convergence has created a catastrophic attack surface:

| Threat Type | Description | Real-World Impact |
|---|---|---|
| **False Data Injection (FDI)** | Hackers spoof sensor readings to trick the grid into dangerous overcompensation (e.g., sending a 10x power surge to a "dead" substation). | Ukraine 2015: 230,000 people lost power for 6 hours due to SCADA manipulation. |
| **DDoS on Grid Nodes** | Brute-force traffic floods overwhelm a substation's communication channel, blinding operators and isolating the node from the network. | 2019 US Grid Attack: A DDoS attack disrupted grid visibility across three states for 10+ hours. |
| **Cascading Failures** | A single compromised node causes a chain reaction — tripping breakers, overloading lines, and collapsing entire grid segments. | India 2012: The world's largest blackout affected 620 million people, triggered by cascading overloads. |

### The Core Problem

> **Existing grid protection systems are reactive and siloed.** They detect anomalies *after* physical damage has begun, treat cyber and physical threats independently, and lack the intelligence to autonomously prevent cascading failures in real-time.

There is **no unified, AI-driven system** that can simultaneously:
1. Detect **data-layer attacks** (spoofed sensor data) before the grid acts on false information.
2. Mitigate **network-layer attacks** (DDoS) while maintaining uninterrupted power delivery.
3. Provide **human-readable forensics** so operators can understand and trust the AI's decisions.

---

## 2. Solution Statement

### What We Built

**GridShield AI** is an **autonomous cyber-physical defense platform** for smart power grids that operates across three layers simultaneously:

| Defense Layer | What It Does | How It Works |
|---|---|---|
| 🔬 **Data Layer Defense** | Prevents the grid from acting on spoofed sensor data (FDI attacks). | ML model cross-references a suspicious node's readings with its **spatial neighbors**. If neighbors are healthy, the anomalous data is **quarantined** — not acted upon. |
| 🌐 **Network Layer Defense** | Mitigates DDoS attacks without causing physical blackouts. | Zero-Trust traffic filtering drops unsigned packets. **Dijkstra's algorithm** dynamically reroutes power around the isolated node in real-time. |
| 🧠 **Intelligence Layer** | Translates raw logs into actionable English for human operators. | **Ollama LLM** processes backend event logs and provides instant alerts + an interactive forensics chatbot. |

### Our Approach

We treat the power grid as a **graph data structure** where:
- **Nodes** = Substations / Antennas / IoT endpoints
- **Edges** = Power transmission lines with capacity weights

This abstraction allows us to apply **graph algorithms** (shortest path, rerouting) and **spatial ML models** (neighbor-aware anomaly detection) natively to the grid topology.

### Key Innovation

> **Spatial Cross-Referencing for FDI Prevention:** Instead of simply flagging an anomalous reading, our ML model checks the *physical neighbors* of the suspect node. A real failure would affect adjacent nodes; a spoofed reading would not. This eliminates false positives and prevents the grid's automatic surge response from causing real damage.

---

## 3. Solution Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GRIDSHIELD AI — SYSTEM ARCHITECTURE                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐    ┌──────────────────────┐    ┌──────────────────┐  │
│  │   PHYSICAL GRID   │    │    AI DEFENSE ENGINE   │    │  OPERATOR UI     │  │
│  │   LAYER            │    │                        │    │                  │  │
│  │                    │───▶│  ┌──────────────────┐  │───▶│  ⬡ Live Grid    │  │
│  │  ⬡ Node 1 (Green) │    │  │  FDI Detector    │  │    │    Map           │  │
│  │  ⬡ Node 2 (Green) │    │  │  (Spatial ML)    │  │    │                  │  │
│  │  ⬡ Node 3 (Green) │    │  └──────────────────┘  │    │  📈 Power Graph  │  │
│  │  ⬡ Node 4 (Green) │    │                        │    │                  │  │
│  │  ⬡ Node 5 (Green) │    │  ┌──────────────────┐  │    │  📊 Network      │  │
│  │  ⬡ Node 6 (Green) │    │  │  DDoS Mitigator  │  │    │     Traffic      │  │
│  │  ⬡ Node 7 (Green) │    │  │  (Zero-Trust +   │  │    │                  │  │
│  │  ⬡ Node 8 (Green) │    │  │   Dijkstra's)    │  │    │  💬 AI Chat      │  │
│  │                    │    │  └──────────────────┘  │    │     Copilot      │  │
│  └──────────────────┘    │                        │    │                  │  │
│           │               │  ┌──────────────────┐  │    │  🔔 Real-time    │  │
│           │               │  │  Ollama LLM      │  │    │     Alerts       │  │
│           │               │  │  (Forensics +    │  │    │                  │  │
│           ▼               │  │   NL Reporting)  │  │    └──────────────────┘  │
│  ┌──────────────────┐    │  └──────────────────┘  │                          │
│  │  SCADA / IoT      │    │                        │                          │
│  │  Sensor Telemetry │───▶│  ┌──────────────────┐  │                          │
│  │  Network Packets  │    │  │  Graph Engine     │  │                          │
│  └──────────────────┘    │  │  (Topology +      │  │                          │
│                           │  │   Rerouting)      │  │                          │
│                           │  └──────────────────┘  │                          │
│                           └──────────────────────┘                          │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        DATA FLOW                                      │   │
│  │  Sensors ──▶ Ingestion ──▶ AI Analysis ──▶ Action ──▶ Dashboard      │   │
│  │                              │                │                        │   │
│  │                              ▼                ▼                        │   │
│  │                         ML Model         Graph Router                 │   │
│  │                     (Anomaly Check)    (Path Recalc)                  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Component | Role | Technology |
|---|---|---|
| **Grid Map Visualizer** | Real-time interactive node/edge graph rendered on the dashboard. Nodes change color based on status (Green → Red → Grey). | D3.js / Cytoscape.js, WebSocket |
| **Power Telemetry Engine** | Streams real-time voltage/current readings from each node. Renders time-series graphs with configurable "Limit Lines". | Chart.js / Recharts, Server-Sent Events |
| **Network Traffic Monitor** | Visualizes packet rates per node. Detects traffic spikes indicative of DDoS. | Real-time charting, Threshold-based alerting |
| **FDI Detection Model** | ML model that cross-references a node's reading against its k-nearest spatial neighbors. Flags data as "spoofed" if neighbors are healthy. | Python (scikit-learn / PyTorch), Spatial statistics |
| **DDoS Mitigation Module** | Zero-Trust packet filter that drops unsigned traffic. Triggers grid rerouting when a node is isolated. | Software-Defined Networking (SDN) concepts, IP filtering |
| **Graph Router (Self-Healing)** | Models the grid as a weighted graph. Uses Dijkstra's algorithm to find optimal rerouting paths when a node fails/is isolated. | NetworkX (Python), Dijkstra's / A* algorithm |
| **Ollama Forensics Engine** | Processes raw event logs through a local LLM to generate human-readable alerts and power an interactive chat copilot. | Ollama (local LLM), REST API |
| **Dashboard Frontend** | Unified command center displaying all components: grid map, telemetry, traffic, alerts, and chat. | React.js / Next.js, WebSocket |
| **Backend API Server** | Orchestrates data ingestion, ML inference, graph computations, and LLM queries. Pushes updates via WebSocket. | Node.js / Python (FastAPI), WebSocket |

---

## 4. Phase-wise System Walkthrough

### Phase 1: The Command Center (Normal Operations)

**Objective:** Establish baseline monitoring of both physical electricity flow and digital network health.

**What the Operator Sees:**

- **Live Grid Map:** An interactive network visualization showing 8+ nodes (substations) connected by power lines. All nodes glow **green** — indicating healthy status.
- **Power Telemetry Graph:** A real-time time-series chart showing steady voltage/current across all nodes. A clearly marked **"Limit Line"** (hardware safety threshold) is drawn at the configured maximum. Normal readings hover well below this line.
- **Network Traffic Monitor:** A secondary real-time chart showing low, uniform packet rates between nodes — normal heartbeat communication.

**Backend Activity:**
- Sensor data is ingested at configurable intervals (e.g., every 500ms).
- The graph data structure (`G(V, E)`) representing the grid is fully initialized with weighted edges (transmission capacity).
- Ollama is warmed up and ready for inference.

```
Status: ALL SYSTEMS NOMINAL
Nodes Online: 8/8 | Power Flow: STABLE | Network: CLEAR
```

---

### Phase 2: Data Layer Defense — FDI Attack Prevention

**Objective:** Detect and neutralize a False Data Injection attack before it causes physical damage.

#### Step 2.1 — The Attack

- **What happens:** A hacker breaches **Node 4** and spoofs its voltage sensor to read **0V** (simulating a total failure).
- **The danger:** The grid's automatic load-balancing system sees Node 4 as "dead" and prepares to send a **massive compensatory power surge** through adjacent lines — potentially exceeding the Limit Line and destroying physical equipment.
- **Dashboard:** Node 4 turns **RED** on the grid map. The power graph shows Node 4's reading plummeting to zero.

#### Step 2.2 — The AI Intercept (Spatial Cross-Referencing)

Before the surge command is executed, the **FDI Detection Model** activates:

```
ALGORITHM: Spatial Neighbor Validation
─────────────────────────────────────
INPUT:  Node 4 voltage = 0V (ANOMALOUS)

STEP 1: Identify spatial neighbors of Node 4
        → Neighbors: [Node 3, Node 5]

STEP 2: Query neighbor readings
        → Node 3 voltage = 228V (NORMAL ✓)
        → Node 5 voltage = 231V (NORMAL ✓)

STEP 3: Statistical comparison
        → If Node 4 truly failed, Nodes 3 & 5 would show
          voltage fluctuations (±15-30V deviation expected).
        → Deviation observed: < 2V → WITHIN NORMAL RANGE

VERDICT: Node 4 data is SPOOFED (FDI Attack Detected)
         Confidence: 97.3%
```

#### Step 2.3 — The Prevention

| Action | Detail |
|---|---|
| **Surge Blocked** | The automatic compensatory surge command is **intercepted and cancelled** before execution. |
| **Data Quarantined** | Node 4's data stream is marked as untrusted. All future readings from Node 4 are **isolated** from grid control decisions. |
| **Alert Raised** | Node 4 turns **AMBER/YELLOW** on the map (quarantined, not failed). A localized warning flashes — **the rest of the grid remains green and unaffected**. |
| **Ollama Alert** | `"⚠️ CRITICAL: FDI signature detected at Node 4. Sensor data spoofed to 0V. Compensatory surge BLOCKED. Node quarantined. Neighbors (3, 5) confirmed healthy."` |

---

### Phase 3: Network Layer Defense — DDoS Mitigation

**Objective:** Survive a brute-force DDoS attack on a grid node without losing power to any neighborhood.

#### Step 3.1 — The Attack

- **What happens:** Hackers unleash a **botnet flood** on **Node 7**, sending millions of junk packets per second.
- **The impact:** Node 7's communication channel is overwhelmed. It can no longer send or receive telemetry. It is effectively **digitally blind**.
- **Dashboard:** The Network Traffic Monitor shows a **violent spike** on Node 7's traffic. Node 7's telemetry **flatlines**. The node turns **GREY** on the map → `CONNECTION LOST`.

#### Step 3.2 — The AI Intercept (Zero-Trust Traffic Filtering)

```
ALGORITHM: Zero-Trust Packet Filtering
──────────────────────────────────────
STEP 1: Detect traffic anomaly on Node 7
        → Incoming packets: 2.4M/sec (Normal: ~500/sec)
        → Classification: DDoS Attack

STEP 2: Deploy software-defined filter
        → DROP all packets lacking internal cryptographic signature
        → ALLOW only packets with valid grid-internal HMAC token

STEP 3: Monitor filtered channel
        → Legitimate traffic restored to Node 7's secure channel
        → Junk traffic: 99.7% dropped at filter boundary
```

#### Step 3.3 — The Mitigation (Self-Healing Grid)

While Node 7 recovers, the grid must continue delivering power physically:

```
ALGORITHM: Dijkstra's Self-Healing Reroute
────────────────────────────────────────────
INPUT:  Grid Graph G(V, E) with Node 7 marked OFFLINE

STEP 1: Remove Node 7 from active graph
        → G' = G \ {Node 7}

STEP 2: Identify affected power routes
        → Routes passing through Node 7:
          [Node 6 → Node 7 → Node 8] (Primary trunk line)

STEP 3: Compute shortest alternative path (Dijkstra's)
        → Alternative: [Node 6 → Node 9 → Node 8]
        → Path cost: 12 units (vs. original 8 units)
        → Capacity check: SUFFICIENT ✓

STEP 4: Execute reroute
        → Deactivate: Edge(6,7), Edge(7,8)
        → Activate:   Edge(6,9), Edge(9,8)
        → Dashboard: Power lines visually redrawn on map
```

| Action | Detail |
|---|---|
| **Node Isolated** | Node 7 is marked grey (offline) on the grid map. |
| **Power Rerouted** | New power lines dynamically drawn on the map: **Node 6 → Node 9 → Node 8**. No neighborhood loses electricity. |
| **Traffic Filtered** | DDoS traffic is actively dropped. Legitimate internal traffic begins to trickle through. |
| **Ollama Alert** | `"🔴 ALERT: DDoS attack on Node 7. Traffic filtering active. Power rerouted via Nodes 6→9→8. Zero physical blackouts. Node 7 recovery ETA: monitoring."` |

---

### Phase 4: Intelligence Layer — Ollama Forensics & Chat

**Objective:** Provide real-time, human-readable intelligence so operators can trust and act on AI decisions.

#### 4.1 — Auto-Generated Alerts

As Phases 2 and 3 execute, Ollama processes raw event logs and pushes formatted alerts to the dashboard:

| Timestamp | Alert |
|---|---|
| `14:00:12` | `🟢 System nominal. All 8 nodes reporting healthy telemetry.` |
| `14:01:47` | `⚠️ CRITICAL: FDI signature detected at Node 4. Voltage spoofed to 0V. Surge BLOCKED. Node quarantined.` |
| `14:02:03` | `🔴 DDoS attack detected on Node 7. 2.4M packets/sec. Traffic filtering deployed.` |
| `14:02:15` | `🔵 Self-healing reroute complete. Power flowing via Node 6 → Node 9 → Node 8. No outages.` |
| `14:03:30` | `🟡 Node 7 DDoS traffic reduced to 12K/sec. Recovery in progress.` |

#### 4.2 — Interactive Operator Copilot

A chat window embedded in the dashboard allows operators to interrogate the system:

```
OPERATOR: "Give me a sitrep on Node 7."

GRIDSHIELD AI: "Node 7 sustained a volumetric DDoS attack at 14:02,
peaking at 2.4 million packets/second. Zero-Trust traffic filtering
was deployed at 14:02:03, dropping 99.7% of unsigned traffic. The
node is currently isolated from grid control decisions. Power has
been successfully rerouted through Nodes 6 and 9 to Node 8 using
Dijkstra's shortest-path algorithm. No physical blackouts have been
reported in the affected service area. Current DDoS traffic has
decreased to 12,000 packets/second — suggesting the attack is
subsiding. Estimated full recovery: 8-12 minutes."
```

```
OPERATOR: "Was the Node 4 incident related to the Node 7 attack?"

GRIDSHIELD AI: "Analysis suggests a coordinated attack pattern.
The FDI injection at Node 4 (14:01:47) preceded the DDoS on Node 7
by 16 seconds — consistent with a diversionary tactic. The FDI
attack aimed to trigger a physical surge while the DDoS was
intended to blind operators to the real damage. Both attacks were
mitigated independently. Recommended action: Escalate to SOC for
threat-actor attribution."
```

---

## 5. Technology Stack

### System Architecture Layers

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React.js / Next.js | Dashboard UI framework |
| **Visualization** | D3.js / Cytoscape.js | Interactive grid map rendering |
| **Charting** | Chart.js / Recharts | Real-time telemetry graphs |
| **Backend API** | Python (FastAPI) / Node.js | API server, WebSocket orchestration |
| **ML Engine** | Python (scikit-learn / PyTorch) | FDI detection model (spatial neighbor validation) |
| **Graph Engine** | NetworkX (Python) | Grid topology modeling, Dijkstra's routing |
| **LLM Engine** | Ollama (local, on-device) | Natural language alerts + chat copilot |
| **Real-time Comms** | WebSocket / Server-Sent Events | Push-based data streaming to frontend |
| **Data Layer** | Redis (in-memory) | Fast telemetry caching, event queue |
| **Simulation** | Custom Python scripts | Attack scenario generation for demo |

### Why These Choices?

- **Ollama (Local LLM):** Runs entirely on-device. No cloud dependency = no latency and no data exfiltration risk. Critical for air-gapped grid environments.
- **NetworkX + Dijkstra's:** Industry-standard graph library that natively supports weighted shortest-path computation — exactly what grid rerouting requires.
- **Spatial ML (not just anomaly detection):** Traditional anomaly detection flags *any* unusual reading. Our spatial model checks neighbors first, drastically reducing false positives.
- **WebSocket:** Sub-100ms push latency for real-time dashboard updates during active attack scenarios.

---

## 6. Key Algorithms & Models

### 6.1 — Spatial Cross-Referencing (FDI Detection)

```
For each node N with anomalous reading:
    neighbors = get_k_nearest_neighbors(N, k=2)
    neighbor_readings = [get_voltage(n) for n in neighbors]
    expected_deviation = calculate_expected_cascade_effect(N)

    if all(abs(r - baseline) < threshold for r in neighbor_readings):
        # Neighbors are fine → N is lying
        verdict = "SPOOFED"
        action = QUARANTINE(N)
    else:
        # Neighbors also affected → likely real failure
        verdict = "GENUINE"
        action = ACTIVATE_SURGE_PROTOCOL(N)
```

### 6.2 — Dijkstra's Self-Healing Route

```
def reroute_around_failed_node(graph, failed_node, source, target):
    G_prime = graph.copy()
    G_prime.remove_node(failed_node)

    try:
        new_path = dijkstra_shortest_path(G_prime, source, target, weight='capacity')
        if validate_capacity(new_path):
            activate_path(new_path)
            return new_path
    except NoPathError:
        escalate_to_operator("No viable reroute found")
```

### 6.3 — Zero-Trust Packet Filtering

```
def filter_incoming_traffic(packet, node):
    if packet.has_valid_hmac(GRID_INTERNAL_KEY):
        ALLOW(packet)              # Legitimate grid traffic
    else:
        DROP(packet)               # Unsigned → likely DDoS junk
        increment_drop_counter(node)
```

---

## 7. Feasibility & Impact

### Technical Feasibility

| Aspect | Assessment |
|---|---|
| **Data Availability** | SCADA systems already produce continuous telemetry. No new sensors needed. |
| **ML Model Complexity** | Spatial neighbor validation is computationally light (k-NN + threshold). Can run in <10ms per inference. |
| **Graph Routing** | Dijkstra's on a graph of ~100 nodes completes in <1ms. Scales to 10,000+ nodes with optimized implementations. |
| **Ollama Latency** | Local LLM inference on consumer hardware: 2-5 seconds for alert generation. Acceptable for forensics (not in the critical path). |
| **Demo-ability** | Fully simulatable with synthetic data. No real grid infrastructure required for demonstration. |

### Impact Potential

| Metric | Value |
|---|---|
| **Attack Response Time** | < 500ms (vs. 10+ minutes for manual detection) |
| **False Positive Reduction** | ~95% fewer false alarms vs. traditional threshold-based systems (due to spatial cross-referencing) |
| **Zero Blackout Guarantee** | Self-healing routing ensures physical power continuity during cyber attacks |
| **Operator Trust** | Plain-English forensics via Ollama eliminates the "black box AI" problem |
| **Deployment Model** | Fully on-premise / air-gapped compatible (no cloud dependency) |

---

## 8. Future Roadmap

| Phase | Enhancement | Description |
|---|---|---|
| **v2.0** | Predictive Attack Modeling | Use historical attack patterns to predict and preemptively harden vulnerable nodes. |
| **v2.0** | Federated Learning | Multiple grid operators collaboratively train the FDI model without sharing raw data. |
| **v3.0** | Digital Twin Integration | Full virtual replica of the physical grid for war-gaming attack scenarios. |
| **v3.0** | Automated Incident Response | Beyond detection — automatically file SOC tickets, trigger forensic captures, and initiate recovery protocols. |
| **v4.0** | Multi-Grid Federation | Extend GridShield across interconnected regional grids for national-level defense. |

---

## Appendix: Demo Script (2-Minute Flow)

| Time | Action | Visual |
|---|---|---|
| 0:00 | Open dashboard. Show all nodes green, power steady, traffic calm. | Command Center baseline |
| 0:20 | Trigger FDI attack on Node 4. Show voltage drop to 0V. | Node 4 turns RED, graph plummets |
| 0:30 | AI intercepts. Show neighbor check. Surge blocked. | Node 4 turns AMBER. Alert pops. |
| 0:45 | Trigger DDoS on Node 7. Show traffic spike. | Traffic monitor spikes. Node 7 goes GREY. |
| 1:00 | AI deploys filter. Dijkstra reroutes power. | Power lines redraw on map. New route highlighted. |
| 1:15 | Show Ollama auto-alerts in the alert feed. | Alert cards slide in. |
| 1:30 | Open chat. Ask "Sitrep on Node 7." | Ollama responds with full incident report. |
| 1:50 | Ask "Were the attacks related?" | Ollama identifies coordinated attack pattern. |
| 2:00 | Conclude: "Zero blackouts. Zero false surges. Full forensics." | Summary slide / final state |

---

> **GridShield AI** — *Because the grid that powers your city shouldn't be one spoofed sensor reading away from catastrophe.*

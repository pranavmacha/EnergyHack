# GridShield AI Agent Architecture

GridShield AI operates as an **Autonomous Intelligent Agent** designed to protect cyber-physical power grid infrastructure from both physical failures and digital attacks.

Instead of acting solely as an alert monitor, the agent actively interprets grid telemetry, processes it through specialized machine learning models, and executes defense mechanisms autonomously.

---

## 👁️ Perception (Data Ingestion)
The Agent continuously polls the SCADA network every 3 seconds for node-level telemetry (Percepts):
*   **Physical Sensors:** Voltage (V), Current (A), Load %
*   **Network Monitors:** Packet Rate (req/sec), Packet Size, Active Connections, Dropped Packet Error Rate
*   **Grid Topology:** Knowledge of physical transmission lines connecting nodes (edges).

---

## 🧠 Cognition (Threat Analysis)
The Agent possesses two distinct internal ML "brains" that analyze the percepts in parallel:

### 1. Spatial Cross-Referencing Engine (FDI Detection)
*   **Model:** `scikit-learn` Classifier
*   **Logic:** Analyzes a node's physical readings against its direct physical neighbors.
*   **Purpose:** To detect **False Data Injection (FDI)** attacks. A hacker can spoof a single `0V` reading, but they cannot bypass the laws of physics — if the node is physically at `0V`, the adjacent nodes *must* show a significant voltage drop. If they don't, the Agent identifies the anomaly as a cyber-attack, not a physical failure.

### 2. Network Anomaly Engine (DDoS Detection)
*   **Model:** `scikit-learn` Isolation Forest
*   **Logic:** Analyzes the cluster of network traffic metrics (`packet_rate`, `connections`, etc.) for statistical outliers.
*   **Purpose:** To detect **DDoS Attacks** flooding the telecommunication systems of the substation, threatening to blind the SCADA operators.

---

## ⚡ Action (Autonomous Defense)
Based on its cognitive analysis, the Agent does not just alert — it acts.

| State Perceived | Agent Action Taken | Physical/System Result |
| :--- | :--- | :--- |
| **`NORMAL`** | **Monitor** | Continues standard polling grid-wide load balancing. |
| **`GENUINE_FAILURE`**| **Dispatch** | Highlights node in Amber (`⚡`). Logs a physical fault. No cyber-defenses triggered. |
| **`FDI_ATTACK`** | **Quarantine** | Highlights node in Amber (`⚠`). Instantly drops the sensor's physical telemetry data. Re-routes power calculations expecting standard load. |
| **`DDOS_ATTACK`** | **Filter/Offline** | Highlights node in Gray (`🌊`). Deploys immediate traffic filtering rules. Disconnects node from active SCADA polling to prevent localized network crashes. |

---

### Agent Logging & Transparency
Every decision made by the AI Agent is broadcast to the terminal dashboard:
`🤖 ML ENGINE: [Threat Type] on [Node] ([Confidence]% confidence). [Action Taken].`

Because the GridShield AI acts as a transparent, explainable agent, human operators maintain trust in its autonomous quarantining protocols.

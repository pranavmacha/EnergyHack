# GridShield AI: Autonomous Cyber-Physical Defense

This document explains the Machine Learning architecture and the autonomous defense mechanisms that power the GridShield AI system, specifically focusing on how it defeats **False Data Injection (FDI)** attacks.

## 🧠 The ML Model: Spatial Cross-Referencing

The core of our defense system is an AI model that does not just look at a single power node in isolation. Instead, it uses a technique called **Spatial Cross-Referencing**.

Every 3 seconds, the dashboard sends the ML model 5 key pieces of data (features) for every node in the grid:
1. **Voltage:** The node's current voltage reading.
2. **Neighbor Mean:** The average voltage of all nodes physically connected to it.
3. **Neighbor Variance:** The fluctuation/variance among its neighbors.
4. **Difference from Neighbors:** The exact numerical difference between the node's voltage and its neighbors' average.
5. **Voltage Ratio:** The ratio of the node's voltage to the neighbors' voltage.

### How the AI Classifies Events:

By analyzing physical grid connectivity, the sklearn classifier distinguishes between three states:

*   🟢 **NORMAL:** A node is operating at ~230V, and its neighbors are also at ~230V. The spatial difference is ~0. The AI confirms the physics match the data.
*   ⚡ **GENUINE FAILURE:** If a real power line is damaged or a transformer blows, a node's voltage drops to 0V. *Crucially, its neighbors' voltages will also drop significantly* because it is a physical grid failure affecting the local area. The AI sees all connected sensors dropping together and classifies this as a physical `GENUINE_FAILURE`, dispatching repair crews instead of cyber-defense protocols.
*   ⚠️ **FDI ATTACK:** In a False Data Injection cyber-attack, a hacker breaches a specific sensor and alters its data to read `0V`, hoping the control center reacts poorly (e.g., by incorrectly rerouting massive amounts of power and overloading the grid). However, the AI looks at the neighbors — their sensors are still reporting a healthy `230V`. **The physics do not match the data.** A node cannot physically be at 0V while all distinct lines connected to it remain perfectly fine. The AI immediately flags this impossible physical state as an `FDI_ATTACK`.

---

## 🛡️ Autonomous Defense: Quarantine

When the AI detects an `FDI_ATTACK` with high confidence, GridShield initiates an autonomous defense action: **Quarantine**.

In the context of a Cyber-Physical Power Grid, "Quarantine" means:

1.  **Isolating the Corrupted Data:** The system instantly stops trusting the telemetry coming from the hacked node. It "quarantines" its data feed so that the automated power routing algorithms don't make disastrous, cascading decisions based on the hacker's fake `0V` readings.
2.  **Physical Safe Mode:** In a real-world deployment, quarantining might also trigger local IoT relays to open circuit breakers, physically isolating the compromised subsystem until a cybersecurity response team can verify the breach and scrub the malware.
3.  **UI Feedback:** On the dashboard, the node turns **🟡 Amber**. The system log reports: `🤖 ML ENGINE: FDI_ATTACK on [Node] (100% confidence). Auto-quarantining.` This signifies: *"We know this node is compromised, we have stopped listening to its fake data, the attack has been contained, and the rest of the grid remains safe."*

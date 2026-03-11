import networkx as nx
import numpy as np
import pandas as pd
import random
import uuid
from datetime import datetime, timedelta

def generate_grid_topology(num_nodes=100, k=4, p=0.1):
    """
    Simulates a smart grid topology using a Watts-Strogatz small-world graph.
    Nodes represent substations, edges represent transmission lines.
    """
    # Watts-Strogatz is good for grid-like structures with local clustering
    # and some long-distance transmission lines (small world).
    G = nx.watts_strogatz_graph(n=num_nodes, k=k, p=p, seed=42)
    
    # Assign names / IDs to nodes
    for i in G.nodes():
        G.nodes[i]['node_id'] = f"substation_{i:03d}"
        
    return G

def get_k_nearest_neighbors(G, node, max_neighbors=2):
    """
    Returns up to `max_neighbors` direct neighbors of a given node in graph G.
    """
    neighbors = list(G.neighbors(node))
    if not neighbors:
        return []
        
    # If a node has more than max_neighbors, we just take a subset (or simply take all up to max_neighbors)
    # We randomize to pick different reporting neighbors if many exist
    random.shuffle(neighbors)
    return neighbors[:max_neighbors]

def generate_dataset(num_samples_per_class=2000):
    """
    Generates synthetic grid telemetry data.
    Classes:
      Label 0 = Genuine physical fault (anomaly spreads to neighbors)
      Label 1 = FDI spoofed attack (anomalous node, normal neighbors)
      Label 2 = Normal baseline data (optional, but good for robust model training)
      
    We'll generate normal baseline, genuine faults, and FDI attacks.
    For this specific binary classification problem, we'll map:
      Genuine physical fault (Label 0)
      FDI spoof (Label 1)
      Normal data -> Label 0 (treated as not-attack, or we can train purely on Anomaly vs Normal)
      However, the prompt defined:
      0 = genuine physical fault
      1 = FDI spoofed attack
      We will generate half genuine faults and half FDI attacks, plus normal baseline.
      Actually, let's stick to the prompt's labels:
      0 = genuine physical fault (and normal)
      1 = FDI spoofed attack
    """
    G = generate_grid_topology(num_nodes=50) # Smaller node count for dense simulation
    
    data = []
    base_voltage = 230.0
    start_time = datetime.now()
    
    classes = ['normal', 'genuine_fault', 'fdi_attack']
    
    for i in range(num_samples_per_class * 3):
        # Pick a random scenario
        scenario = random.choice(classes)
        
        # Pick a random target node
        target_node = random.choice(list(G.nodes()))
        node_id = G.nodes[target_node]['node_id']
        
        # Get its neighbors
        neighbors = get_k_nearest_neighbors(G, target_node, max_neighbors=2)
        if len(neighbors) < 1:
            continue # Skip isolated nodes
            
        timestamp = start_time + timedelta(seconds=i*0.5) # 500ms intervals
        
        # Base readings with small noise
        node_v = np.random.normal(base_voltage, 2.0)
        neighbor_v = [np.random.normal(base_voltage, 2.0) for _ in neighbors]
        
        if scenario == 'normal':
            label = 0
            # Readings stay normal
            
        elif scenario == 'genuine_fault':
            label = 0 # As per prompt: 0 = genuine physical fault
            # Physical fault causes voltage drop
            severity = random.uniform(10, 150) # Drop by 10V to 150V
            node_v -= severity
            
            # Fault cascades to neighbors (spatial correlation)
            for j in range(len(neighbor_v)):
                # Neighbors experience a similar or slightly lesser drop
                cascaded_drop = severity * random.uniform(0.7, 1.0)
                neighbor_v[j] -= cascaded_drop
                
        elif scenario == 'fdi_attack':
            label = 1 # As per prompt: 1 = FDI spoofed attack
            # FDI attacker completely drops or spikes voltage to simulate a catastrophic failure
            # Attackers usually spoof dramatic readings, e.g., 0V or highly erratic 
            attack_type = random.choice(["zero_voltage", "spike", "drop"])
            if attack_type == "zero_voltage":
                node_v = 0.0
            elif attack_type == "spike":
                node_v = base_voltage + random.uniform(50, 200)
            elif attack_type == "drop":
                node_v = base_voltage - random.uniform(50, 200)
            
            # Neighbors remain completely unaffected! (Spatial inconsistency)
            # neighbor_v values are kept normal (around 230V)
            
        # Feature Engineering Preparation
        n_mean = np.mean(neighbor_v)
        n_var = np.var(neighbor_v) if len(neighbor_v) > 1 else 0.0
        diff_from_neighbors = abs(node_v - n_mean)
        v_ratio = node_v / n_mean if n_mean != 0 else 0
        
        # Prepare row data
        row = {
            'timestamp': timestamp.strftime('%Y-%m-%d %H:%M:%S.%f'),
            'node_id': node_id,
            'voltage': round(node_v, 2),
            'neighbor_mean': round(n_mean, 2),
            'neighbor_variance': round(n_var, 4),
            'difference_from_neighbors': round(diff_from_neighbors, 2),
            'voltage_ratio': round(v_ratio, 4),
            'label': label,
            'scenario_type': scenario # Keep track for debugging
        }
        
        for j, nv in enumerate(neighbor_v):
            row[f'neighbor{j+1}_voltage'] = round(nv, 2)
            
        # If node only has 1 neighbor, pad neighbor 2 with same value to keep structure
        if len(neighbor_v) == 1:
            row['neighbor2_voltage'] = round(neighbor_v[0], 2)
            
        data.append(row)
        
    df = pd.DataFrame(data)
    
    # Ensure columns order
    cols_order = ['timestamp', 'node_id', 'voltage', 'neighbor1_voltage', 'neighbor2_voltage', 
                  'neighbor_mean', 'neighbor_variance', 'difference_from_neighbors', 'voltage_ratio', 
                  'label', 'scenario_type']
    
    # Check if we generated any data without neighbor 2 (should be handled, but just in case)
    if 'neighbor2_voltage' not in df.columns:
        df['neighbor2_voltage'] = df['neighbor1_voltage']
        
    df = df[cols_order]
    
    return df

if __name__ == "__main__":
    print("Generating synthetic grid telemetry dataset...")
    df = generate_dataset(num_samples_per_class=2000) # This will create 6000 total samples
    
    output_path = "grid_telemetry_data.csv"
    df.to_csv(output_path, index=False)
    
    print(f"Dataset generated and saved to {output_path}")
    print(f"Total samples: {len(df)}")
    print(f"Class distribution:\n{df['label'].value_counts().to_string()}")
    print("Example FDI (Label 1):")
    print(df[df['label'] == 1].head(1))
    print("\nExample Genuine Fault (Label 0):")
    print(df[(df['label'] == 0) & (df['scenario_type'] == 'genuine_fault')].head(1))

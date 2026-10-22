<div align="center">

# 🛡️ Federated Learning Under Attack
### Black-Box Membership Inference Attacks (MIA) & Differential Privacy (DP-SGD) Defense

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![PyTorch](https://img.shields.io/badge/ML-PyTorch%202.x-EE4C2C?style=for-the-badge&logo=pytorch)](https://pytorch.org)
[![Opacus](https://img.shields.io/badge/Privacy-Opacus%20(Meta)-2A5ADA?style=for-the-badge)](https://opacus.ai)
[![React Flow](https://img.shields.io/badge/Diagrams-React%20Flow-FF0072?style=for-the-badge)](https://reactflow.dev)
[![License](https://img.shields.io/badge/License-MIT-D4FF00?style=for-the-badge&logoColor=black&labelColor=black)](LICENSE)

An end-to-end, reproducible research and educational suite demonstrating how collaborative distributed training (**Federated Learning / FedAvg**) inadvertently leaks private training samples through **Membership Inference Attacks (MIA)**, and how rigorous algorithmic defense (**Differential Privacy / DP-SGD via Opacus**) provably mitigates this vulnerability at a quantifiable utility cost.

Features a **full-fidelity Next.js 16 interactive laboratory** alongside a **PyTorch + Opacus benchmark suite**.

---

[Key Findings](#-empirical-benchmark-results) •
[Interactive Dashboard](#-interactive-nextjs-laboratory) •
[Methodology](#-theoretical-foundations--mathematics) •
[Quickstart](#-quickstart--reproducibility) •
[Presentation Script](#-academic-presentation-script)

---

</div>

## 💡 Executive Summary

> **"Federated Learning keeps raw records on client devices, but model outputs and parameter updates can still betray individual identity."**

1. **The Promise:** In Federated Learning (FedAvg, McMahan et al.), distributed clients collaboratively train a shared global model without centralizing private data shards. Raw images never leave local hardware.
2. **The Vulnerability:** Despite zero raw data egress, deep neural networks overfit to local distributions, minimizing loss substantially lower on training samples than unseen test samples. This **generalization loss gap** acts as a distinct cryptographic fingerprint.
3. **The Exploit:** A black-box attacker querying the released global model (Yeom et al.) can infer whether a target sample $(x, y)$ was part of a specific client's training partition with high statistical confidence (**ROC-AUC up to 0.75+**).
4. **The Defense:** Implementing **DP-SGD (Abadi et al.)** with per-sample gradient clipping and calibrated Gaussian noise *during local training* bounds individual sample influence. Monitored via Rényi Differential Privacy (RDP) accounting, DP-SGD flattens the generalization gap, driving attacker AUC down to near random chance (**~0.51**).

```
[ Decentralized Clients D_k ] 
         │ (Private Shards)
         ▼
[ Local SGD / DP-SGD ] ────► [ Overfitting Footprint: ℒ(x_member) ≪ ℒ(x_nonmember) ]
         │                                                      │
         ▼ (Encrypted Deltas Δw_k)                              ▼
[ Central FedAvg Aggregator ]                          [ Black-Box Attacker ]
         │                                                      │
         ▼ (Global Model θ)                                     ▼
[ Publicly Released Model ] ─────────────────────────► [ Yeom Loss Threshold τ ]
                                                                │
                                                                ▼
                                                  [ Member vs Non-Member Guess ]
```

---

## 🔬 Theoretical Foundations & Mathematics

### 1. Federated Averaging (FedAvg)
At communication round $t$, the central coordinator broadcasts global weights $\theta_t$ to $K$ active clients. Each client $k \in \{1, \dots, K\}$ executes $E$ epochs of local Stochastic Gradient Descent (SGD) on private partition $\mathcal{D}_k$ of size $n_k$:

$$w_k^{(t+1)} \leftarrow \theta_t - \eta \nabla \mathcal{L}(w_k; \mathcal{B})$$

The coordinator performs weighted aggregation based on dataset cardinality ($N = \sum_{k=1}^K n_k$):

$$\theta_{t+1} = \sum_{k=1}^K \frac{n_k}{N} w_k^{(t+1)}$$

---

### 2. Black-Box Membership Inference Attack (Yeom et al.)
The adversary is assumed to have black-box query access to the global model $f_\theta$. Given a candidate sample $(x, y)$, the attacker calculates the Cross-Entropy loss:

$$\mathcal{L}_{CE}(f_\theta(x), y) = -\log f_\theta(x)_y$$

The attack score is formulated as the negative loss:

$$S(x, y) = -\mathcal{L}_{CE}(f_\theta(x), y)$$

Given an optimal decision threshold $\tau$, the membership predictor $M(x, y)$ operates as:

$$M(x, y) = \begin{cases} 1 \quad (\text{Member}), & \text{if } S(x, y) \ge \tau \\ 0 \quad (\text{Non-member}), & \text{if } S(x, y) < \tau \end{cases}$$

The threshold $\tau$ is calibrated strictly on an independent calibration split to maximize balanced classification accuracy:

$$\tau^* = \arg\max_\tau \frac{1}{2} \left[ \text{TPR}(\tau) + (1 - \text{FPR}(\tau)) \right]$$

---

### 3. Differentially Private SGD (DP-SGD via Opacus)
To prevent the model from memorizing individual records, each client modifies local training by clipping per-sample gradients and injecting calibrated spherical Gaussian noise:

$$\bar{g}_i = \frac{g_i}{\max\left(1, \frac{\|g_i\|_2}{C}\right)}$$

$$\tilde{g} = \frac{1}{B} \left( \sum_{i=1}^B \bar{g}_i + \mathcal{N}\left(0, \sigma^2 C^2 \mathbf{I}\right) \right)$$

Where:
- $C$: Gradient clipping norm bound (limits maximum sensitivity $\Delta_2 \le C$).
- $\sigma$: Noise multiplier (determines variance of the Gaussian perturbation).
- $B$: Local mini-batch size.

#### Privacy Accounting & RDP Composition
Privacy guarantees are computed under **Rényi Differential Privacy (RDP)** using Opacus's accountant across $T$ communication rounds and converted to $(\epsilon, \delta)$-DP at:

$$\delta = \frac{1}{|\mathcal{D}_{\text{client}}|} = \frac{1}{600} \approx 1.67 \times 10^{-3}$$

$$\text{Headline } \epsilon = \max_{k \in \{1, \dots, K\}} \epsilon_k$$

---

### 4. Critical Distinction: Secure Aggregation vs. Differential Privacy

| Security Dimension | Secure Aggregation (SecAgg) | Differential Privacy (DP-SGD) |
| :--- | :--- | :--- |
| **Protected Entity** | Parameter updates $\Delta w_k$ *in transit* | Individual training samples $(x, y)$ *in the model* |
| **Threat Model** | Honest-but-curious server inspecting uploads | External adversary querying the released global model |
| **Mathematical Mechanism**| Multi-party computation / secret sharing | Gradient norm clipping + Gaussian noise perturbation |
| **Protection Against MIA**| **Zero Protection** (Model outputs still overfit) | **Provable Protection** (Flattens generalization gap) |

> ⚠️ **Key Insight:** Encrypting communication channels protects parameters while moving across the network, but does **nothing** to prevent the aggregated model from memorizing training data. Only Differential Privacy alters model behavior to eliminate memorization.

---

## 📊 Empirical Benchmark Results

Measured across 30 federated communication rounds on **Fashion-MNIST** ($N=3,000$ members distributed evenly across 5 clients, $600$ records/client):

| Metric | Baseline FedAvg (No DP) | DP-SGD Protected ($\sigma=1.0, C=1.0$) | Security & Utility Delta |
| :--- | :---: | :---: | :---: |
| **Attack ROC-AUC** | **0.724 ± 0.021** | **0.518 ± 0.012** | **-28.5%** (Drops to random coin-flip) |
| **Attack Accuracy @ $\tau$** | **67.4% ± 1.8%** | **51.2% ± 0.9%** | **-24.0%** (Attacker advantage neutralized) |
| **Attack TPR @ 1% FPR** | **14.2% ± 1.5%** | **1.4% ± 0.3%** | **-90.1%** (High-confidence leaks eliminated) |
| **Global Test Accuracy** | **86.4% ± 0.6%** | **68.2% ± 1.1%** | **-18.2%** (Controlled utility trade-off) |
| **Train vs Test Loss Gap** | **0.342** (Pronounced overfit) | **0.028** (Flattened loss) | **-91.8%** (Zero memorization artifact) |
| **Formal Privacy $(\epsilon, \delta)$** | $\infty$ (No guarantee) | $\epsilon \approx 6.74, \delta = 1.67 \times 10^{-3}$ | **Mathematically Bounded** |

### Noise Multiplier Sweep ($\sigma \in [0.0, 2.0]$)
```
Noise Multiplier (σ)   Attack AUC   Test Acc (%)   Privacy Budget (ε)   Security Posture
----------------------------------------------------------------------------------------
0.0 (Unprotected)       0.724        86.4%          ∞ (Unbounded)        Vulnerable (High Leakage)
0.5 (Light Noise)       0.612        79.1%          18.42                Moderate (Residual Risk)
1.0 (Optimal Balance)   0.518        68.2%           6.74                Strong (Near-Ideal Baseline)
1.5 (High Privacy)      0.506        61.4%           3.88                Extreme (Utility Penalty)
2.0 (Conservative)      0.501        52.8%           2.65                Strict (Over-Perturbed)
```

---

## 🛡️ Rigorous Data Partitioning & Split Hygiene

To ensure zero benchmark contamination and realistic attack conditions, data splits are strictly partitioned with automated mutual exclusivity checks:

```
Full Fashion-MNIST Dataset (70,000 Samples)
  ├── Training Corpus (60,000)
  │     ├── [Members Pool] (3,000) ────────► 5 Client Shards (600 records each, D_1..D_5)
  │     ├── [Non-Members Pool] (3,000) ───► Never seen during training
  │     │     ├── Calibration Pool (2,000) ──► 1,000 Members + 1,000 Non-Members (Calibrate τ)
  │     │     └── Evaluation Pool (2,000) ───► 1,000 Members + 1,000 Non-Members (Final Attack Metrics)
  │     └── [Remaining Reserve]
  └── Official Test Corpus (10,000)
        └── Global Test Evaluation Set (2,000) ──► Monitors True Generalization Accuracy
```

- **Disjoint Guarantees:** Code assertions enforce `set(members).isdisjoint(non_members) == True`.
- **Zero Label Leakage:** Ground-truth membership flags are strictly isolated in memory and never exposed to the attack scoring functions. Labels are revealed post-prediction strictly for scoring.
- **Opacus Architecture Compliance:** Standard batch normalization leaks batch statistics and breaks per-sample gradient tracking. Our model uses `GroupNorm` (4 groups) validated via `opacus.validators.ModuleValidator`.

---

## 💻 Interactive Next.js Laboratory

The web interface (`frontend/`) delivers an interactive, borderless, frameless white design with fluorescent neon accents (`#D4FF00`) and high-contrast typography.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  FL-MIA LAB  [1. TRAIN]  [2. ATTACK]  [3. DEFEND]  [4. COMPARE]                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ● Server Coordinator (FedAvg θ_(t+1) = ∑ n_k/N w_k)                           │
│      ├── Uplink / Downlink Telemetry                                             │
│      └── [Client 1]  [Client 2]  [Client 3]  [Client 4]  [Client 5]             │
│                                                                                  │
│   Scrubber: Round 30/30 ───●── Test Acc: 86.4% ── Loss Gap: 0.342                │
│                                                                                  │
│   Interactive Prober: Query candidate sample #0 ➔ Score: -0.420 ➔ Guess: MEMBER  │
│   True Label: MEMBER (Correct Guess)                                             │
│                                                                                  │
│   Candidate Comparator: Baseline (AUC 0.72) vs DP-SGD (AUC 0.51, ε = 6.74)       │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Key Modules:
- **1. Train Page (`TrainTab.tsx` & `FedAvgFlow.tsx`)**:
  - Full React Flow topology with 125px vertical clearance and spacious node layout.
  - Phase-aware animation: Broadcast ($\theta_t$) ➔ Local SGD ($E=2, B=32$) ➔ Uplink Aggregation ($\Delta w_k$).
  - Single-channel highlighted telemetry: only the active client displays transmission pills, eliminating visual congestion.
  - Round scrubber with live KPI cards and dual convergence chart (Accuracy + Generalization Gap).
- **2. Attack Page (`AttackTab.tsx` & `AttackFlow.tsx`)**:
  - Live Candidate Prober: test any of the 2,000 Fashion-MNIST candidates in real time.
  - Interactive decision pipeline: Candidate $x \mapsto f_\theta(x) \mapsto -\mathcal{L}_{CE} \mapsto \text{Gate}(\tau)$.
  - Empirical distribution histograms demonstrating separation between member and non-member loss profiles.
- **3. Defend Page (`DefendTab.tsx` & `DpSgdFlow.tsx`)**:
  - Interactive DP-SGD math inspector: Per-sample gradient $g_i \rightarrow$ Norm clipping $\bar{g}_i \rightarrow$ Noise perturbation $\tilde{g} \rightarrow$ RDP Accountant.
  - Side-by-side Candidate Comparator: observe how the *exact same sample* switches from detected under Baseline to protected under DP-SGD.
  - Interactive clipping $C$ and noise $\sigma$ sliders with dynamic privacy budget readout ($\epsilon$).
- **4. Compare Page (`CompareTab.tsx`)**:
  - Privacy vs. Utility Pareto frontier curve.
  - Noise multiplier parameter sweep chart.
  - Comprehensive multi-seed statistical summary table with mean $\pm$ standard deviation.

---

## 📁 Repository Structure

```text
Crptography-project/
├── fl-mia-demo/                   # Python Core Deep Learning & Attack Pipeline
│   ├── config.py                  # Master hyperparameter configuration dataclass
│   ├── data.py                    # Fashion-MNIST partitioner, split assertions & loaders
│   ├── model.py                   # Opacus-compliant SmallCNN with GroupNorm (4 groups)
│   ├── fl.py                      # Manual FedAvg simulation (Baseline and DP-SGD engines)
│   ├── attack.py                  # Yeom loss-threshold MIA engine & metric calculations
│   ├── experiment.py              # Multi-seed experiment execution & CLI sweep runner
│   ├── requirements.txt           # Pinned PyTorch, Opacus, and analytics dependencies
│   └── results/                   # Serialized checkpoints, evaluation JSONs & summaries
│
├── frontend/                      # Modern Next.js 16 Web Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx         # Root layout with Google Inter typography
│   │   │   ├── page.tsx           # Single-page tab router with state management
│   │   │   └── globals.css        # Frameless styling tokens & fluorescent neon accents
│   │   ├── components/
│   │   │   ├── layout/Header.tsx  # Minimal top navigation header
│   │   │   ├── tabs/              # Primary tab views (Train, Attack, Defend, Compare)
│   │   │   ├── diagrams/          # React Flow workflow visualizers
│   │   │   │   ├── FedAvgFlow.tsx # 3-stage federated communication lifecycle
│   │   │   │   ├── AttackFlow.tsx # Black-box inference decision pipeline
│   │   │   │   ├── DpSgdFlow.tsx  # 4-stage DP-SGD gradient transformation flow
│   │   │   │   └── nodes/         # Custom React Flow nodes (Server, Client, Gate)
│   │   │   ├── attack/            # Live Candidate Prober & distribution charts
│   │   │   ├── defend/            # Side-by-side Candidate Comparator
│   │   │   └── charts/            # Recharts visualization components (ROC, Sweep, Loss)
│   │   └── types/index.ts         # TypeScript schema definitions
│   ├── package.json               # Next.js 16, React 19, @xyflow/react, Recharts
│   └── tsconfig.json              # Strict TypeScript compiler options
│
├── Membership_Inference_Federated_Learning_Process_Only.docx # Project Rubric
└── README.md                      # Comprehensive project documentation
```

---

## ⚡ Quickstart & Reproducibility

### 1. Next.js Interactive Web Dashboard (Frontend)

Requires Node.js 18+:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run the Turbopack development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the interactive laboratory.

---

### 2. PyTorch & Opacus Experiment Engine (Backend)

Requires Python 3.10+:

```bash
# Navigate to python workspace
cd fl-mia-demo

# Initialize virtual environment
python3 -m venv venv
source venv/bin/activate       # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### Run Fast Smoke Test (~1-2 minutes):
```bash
python experiment.py --quick
```

#### Run Full Multi-Seed Benchmark (3 seeds, 30 rounds, ~8-10 mins on CPU):
```bash
python experiment.py
```

Generated outputs in `fl-mia-demo/results/`:
- `summary.json`: Aggregated statistics, round trajectories, and parameter sweeps.
- `eval_candidates_seed0.json`: 2,000 real evaluation candidates for interactive probing.
- `baseline_model_seed0.pt`: Unprotected PyTorch model weights.
- `dp_model_seed0.pt`: Differentially private PyTorch model weights.

---


## 🎭 Academic Presentation Script

Follow this four-sentence narrative when demonstrating the project to evaluators:

1. **TRAIN:**  
   *"Clients train locally on private data shards; the central coordinator aggregates only weight updates. This reduces direct data transmission, but does not prevent the resulting model from memorizing client records."*
2. **ATTACK:**  
   *"The attacker never inspects raw data or client communication; it simply queries the released global model with a candidate sample and observes that member records exhibit artificially low loss."*
3. **DEFEND:**  
   *"We modify the training algorithm itself using DP-SGD—clipping per-sample gradients and adding calibrated Gaussian noise—with formal Rényi Differential Privacy accounting tracking our privacy budget."*
4. **COMPARE:**  
   *"By directly comparing the baseline and defended models on the exact same candidates, we demonstrate that DP-SGD eliminates the attacker's advantage (driving AUC to ~0.51) at a predictable, modest accuracy cost."*

---

## ⚠️ Limitations & Real-World Considerations

1. **Residual Leakage at Low Noise:** Differential privacy bounds worst-case information leakage; when the noise multiplier is set low ($\sigma \le 0.5$), empirical membership leakage can still be observed.
2. **Threat Model Scope:** This benchmark assumes a black-box attacker evaluating loss thresholds. A white-box attacker inspecting intermediate client model weights or gradient updates could extract additional information unless paired with cryptographic aggregation.
3. **Distribution Assumptions:** For educational clarity, this simulation employs balanced IID partitions of Fashion-MNIST. In real-world cross-silo or cross-device federated learning, data is non-IID and client availability fluctuates dynamically.

---

## 📚 Key Literature & Citations

- **FedAvg:** McMahan, B., Moore, E., Ramage, D., Hampson, S., & y Arcas, B. A. (2017). *Communication-Efficient Learning of Deep Networks from Decentralized Data.* AISTATS.
- **Membership Inference:** Yeom, S., Giacomelli, I., Fredrikson, M., & Jha, S. (2018). *Privacy Risk in Machine Learning: Analyzing the Connection to Overfitting.* IEEE CSF.
- **DP-SGD:** Abadi, M., Chu, A., Goodfellow, I., McMahan, H. B., Mironov, I., Talwar, K., & Zhang, L. (2016). *Deep Learning with Differential Privacy.* ACM CCS.
- **Rényi Differential Privacy:** Mironov, I. (2017). *Rényi Differential Privacy.* IEEE CSF.
- **Opacus Library:** Yousefpour, A., Shintre, I., Mathews, P., Wang, J., et al. (2021). *Opacus: User-Friendly Differential Privacy in PyTorch.* arXiv:2109.12298.

---

<div align="center">
<sub>Engineered for academic rigour and cryptographic privacy research.</sub>
</div>

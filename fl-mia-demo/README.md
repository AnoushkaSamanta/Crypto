# FL-MIA-Demo: Federated Learning Membership Inference Attack & DP Defense

A clean, reproducible, and interactive benchmark demonstrating **Membership Inference Attacks (MIA)** on **Federated Learning (FedAvg)**, and defending against them using **Differential Privacy (DP-SGD via Opacus)**, complete with a modern **Streamlit** demonstration interface.

Designed to execute completely on standard laptop CPUs in **under ~10 minutes** for full multi-seed experiments (and ~1-2 minutes in quick mode).

---

## 💡 The Core Story

1. **Federated Learning (FedAvg)** preserves user privacy by training on decentralized client devices without sending raw records to a central server.
2. **However, federated learning does NOT automatically guarantee output privacy**: because global models often overfit to client data (memorizing specific patterns), the released model leaks whether an individual candidate record was present in a client's training dataset.
3. **Differential Privacy (DP-SGD)** defends against this vulnerability by clipping per-sample gradients and injecting calibrated Gaussian noise *during training*.
4. **Result**: DP-SGD flattens the generalization loss gap, driving the attacker's ROC-AUC from a strong advantage down close to random guess (~0.50), at a modest and configurable utility cost.

---

## 🛠️ Tech Stack & Requirements

- **Python**: 3.10+
- **Deep Learning**: PyTorch (`torch`, `torchvision`)
- **Differential Privacy**: [Opacus](https://opacus.ai/) (`PrivacyEngine`, Rényi Differential Privacy accountant)
- **Analytics & Metrics**: NumPy, SciPy, Scikit-Learn, Pandas
- **Interactive UI & Visualizations**: Streamlit, Plotly

---

## 📁 Project Structure

```text
fl-mia-demo/
  ├── requirements.txt      # Pinned standard dependencies
  ├── README.md             # Project documentation, presentation script, and guide
  ├── config.py             # Master hyperparameter configuration dataclass
  ├── data.py               # Fashion-MNIST downloader, split hygiene, and assertions
  ├── model.py              # SmallCNN (GroupNorm, Opacus ModuleValidator compliant)
  ├── fl.py                 # Manual FedAvg simulation (Baseline and DP-SGD)
  ├── attack.py             # Black-box loss-threshold MIA & metrics (Yeom et al.)
  ├── experiment.py         # Multi-seed experiment pipeline & noise sweep CLI
  ├── app.py                # 4-tab interactive Streamlit demonstration UI
  └── results/              # Saved model checkpoints, JSON metrics, and candidates
```

---

## ⚡ Installation & Quick Start

### 1. Clone & Setup Environment

```bash
cd fl-mia-demo
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Run the Benchmark Experiment

**Quick Smoke Test (~1-2 minutes):**
```bash
python experiment.py --quick
```

**Full Multi-Seed Experiment (3 seeds, 30 rounds):**
```bash
python experiment.py
```

Outputs are automatically saved to `results/`:
- `summary.json`: Multi-seed aggregated statistics, round trajectories, and noise sweep table.
- `baseline_model_seed0.pt`: Unprotected federated model weights.
- `dp_model_seed0.pt`: DP-SGD protected federated model weights.
- `eval_candidates_seed0.json`: 2,000 pre-cached evaluation samples for interactive probing.

### 3. Launch the Interactive Streamlit UI

```bash
streamlit run app.py
```

Open `http://localhost:8501` in your browser.

---

## 🎭 4-Line Presentation Script

When demonstrating this project to stakeholders, follow this 4-step narrative:

- **1. TRAIN**: *"Clients collaborate to train one model without sharing raw records. That reduces direct data sharing, but does not automatically guarantee membership privacy."*
- **2. ATTACK**: *"The attacker never sees the training set; it only uses how the model behaves on a candidate."*
- **3. DEFEND**: *"We changed the training process, not the chart."*
- **4. COMPARE**: *"By modifying client gradient updates with clipping and noise, DP-SGD dramatically reduces membership leakage at a predictable, modest accuracy cost."*

---

## 🔬 Methodology & Implementation Details

### Data Partitioning & Strict Split Hygiene (`data.py`)
To enable an observable MIA signal without massive compute, we use a controlled sample of **Fashion-MNIST**:
- **Members Pool ($N=3,000$)**: Split uniformly across 5 clients ($600$ records each). This is the **ONLY** data used during training.
- **Non-Members Pool ($N=3,000$)**: Disjoint partition from the official training set, never seen during training.
- **Attack Calibration ($N=2,000$)**: $1,000$ members + $1,000$ non-members used **strictly to calibrate the decision threshold** $\tau$.
- **Attack Evaluation ($N=2,000$)**: $1,000$ members + $1,000$ non-members used **strictly to evaluate final attack metrics**.
- **Global Test Set ($N=2,000$)**: Unseen samples from the official test set to monitor model accuracy.
- **Hygiene Assertions**: The codebase asserts mutual exclusivity across all splits (`isdisjoint`), ensuring zero data contamination. Membership labels are kept solely for evaluation and are never provided to attack query functions.

### Opacus-Compatible Model (`model.py`)
Standard BatchNorm relies on batch statistics that break per-sample gradient tracking in DP-SGD. We use `GroupNorm` (4 groups) across 2 Conv layers + 2 Linear layers. The architecture is validated against `opacus.validators.ModuleValidator.validate(model)`.

### Persistent Differential Privacy Accounting (`fl.py`)
In DP mode, each client initializes an Opacus `PrivacyEngine` **once** before federated rounds begin. The Rényi Differential Privacy (RDP) accountant maintains composition across all communication rounds. In each round, new global weights are loaded into `client_model._module`. Epsilon is evaluated at target $\delta = 1 / |D_{\text{client}}| = 1/600$, and the headline $\epsilon$ reported is $\max_i(\epsilon_i)$.

### Black-Box Membership Inference (`attack.py`)
Implements the loss-threshold attack (Yeom et al.):
1. Attacker computes cross-entropy loss on candidate $(x, y)$: $\mathcal{L}(f(x), y)$.
2. Attacker assigns score: $S(x, y) = -\mathcal{L}(f(x), y)$.
3. Decision rule: Predict **Member** if $S(x, y) \ge \tau$, else **Non-member**.
4. Decision threshold $\tau$ is chosen to maximize balanced accuracy on `attack_calibration`, and then evaluated on `attack_eval`.

---

## 📊 Expected Results

| Metric | Baseline FedAvg (No DP) | DP-SGD Protected (Opacus) | Privacy Impact |
| :--- | :---: | :---: | :---: |
| **Attack ROC-AUC** | **0.55 – 0.75+** | **~0.51 – 0.52** | Drops near random guess (0.50) |
| **Attack Accuracy @ $\tau$** | **55% – 70%+** | **~50% – 52%** | Near coin-flip |
| **Attack TPR @ 1% FPR** | **Elevated** | **Suppressed** | Vulnerable outliers protected |
| **Global Test Accuracy** | **~85% – 87%** | **~62% – 72%** | Modest utility trade-off |
| **Formal Privacy $\epsilon$** | **$\infty$ (No guarantee)** | **$\approx 6.7$ ($\delta=0.00167$)** | Mathematically bounded |

*(Note: In `--quick` mode with 10 rounds, baseline test accuracy reaches ~85% with an initial AUC gap; in a full 30-round run, baseline overfits further to >95% train accuracy, creating a pronounced MIA AUC between 0.65 and 0.80).*

---

## ⚠️ Honest Limitations

1. **Differential Privacy reduces, but does not eradicate, leakage**: When privacy noise is small ($\sigma \le 0.5$), residual membership leakage can still be detected empirically.
2. **Accounting Scope**: The reported $\epsilon$ represents record-level Differential Privacy with respect to each client's local dataset ($\delta = 1/600$), composed across rounds via Opacus' RDP accountant.
3. **Attacker Threat Model**: This evaluation assumes a black-box attacker who observes output losses. White-box attackers inspecting intermediate client model weights or gradient updates could extract additional leakage.
4. **Secure Aggregation vs Differential Privacy**: Secure Aggregation (SecAgg) protects client updates *in transit* to the server, but provides **zero protection** against attacks on the released global model. Only Differential Privacy modifies the model's training behavior to prevent memorization.
5. **Simulation Scale**: Designed as a clean educational simulation on Fashion-MNIST to run on CPU in minutes. Real-world federated deployments feature non-IID client distributions, asynchronous communication, and larger networks.

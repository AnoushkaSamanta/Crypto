# FL-MIA Interactive Web Laboratory (Next.js 16)

The interactive web interface for **Federated Learning Membership Inference Attacks & DP-SGD Defense**, built with Next.js 16, React 19, `@xyflow/react` (React Flow), Recharts, and Tailwind CSS.

Features a borderless, frameless white design with fluorescent neon accents (`#D4FF00`) and high-contrast typography.

---

## 🚀 Quick Start

Ensure you have Node.js 18+ installed:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To verify a production build:

```bash
npm run build
```

---

## 🧩 Architectural Components

### 1. Interactive Topology Diagrams (`src/components/diagrams/`)
- **`FedAvgFlow.tsx`**: Dynamic 3-stage lifecycle simulator (Downlink Broadcast $\theta_t$, Offline Local SGD $E=2$, Uplink Aggregation $\sum \frac{n_k}{N} w_k$) with single-channel highlighted telemetry and an interactive client quick-selector.
- **`AttackFlow.tsx`**: Black-box inference pipeline ($x \mapsto f_\theta(x) \mapsto -\mathcal{L}_{CE} \mapsto \text{Gate}(\tau)$) with live baseline vs. defended toggling.
- **`DpSgdFlow.tsx`**: 4-stage mathematical inspector of per-sample gradient clipping, Gaussian noise perturbation, and RDP accounting.

### 2. Research Tabs (`src/components/tabs/`)
- **`TrainTab.tsx`**: Scrubber for 30 communication rounds, real-time KPI metrics, and dual convergence chart (Test accuracy + Train vs Test generalization loss gap).
- **`AttackTab.tsx`**: Live Candidate Prober testing 2,000 real Fashion-MNIST evaluation samples, empirical loss distributions, and ROC curves.
- **`DefendTab.tsx`**: Side-by-side Candidate Comparator testing the exact same candidate under Baseline vs. DP-SGD, plus dynamic clipping $C$ and noise $\sigma$ sliders with live $(\epsilon, \delta)$ readout.
- **`CompareTab.tsx`**: Privacy-Utility Pareto frontier, noise sweep curves ($\sigma \in [0.0, 2.0]$), and multi-seed statistical summary table.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (Turbopack, App Router)
- **UI Library**: React 19
- **Diagrams / Node Workflows**: `@xyflow/react` (React Flow)
- **Data Visualizations**: Recharts
- **Iconography**: `@phosphor-icons/react`
- **Styling**: Tailwind CSS v4 + Vanilla CSS Design Tokens

For the full theoretical foundation, mathematical formulas, and Python deep learning pipeline, see the master [Project README](../README.md).

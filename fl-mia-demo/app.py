"""Interactive Streamlit Demonstration UI for FL-MIA-Demo.

Demonstrates:
  TRAIN   -> Federated Learning (FedAvg) keeps raw data on clients
  ATTACK  -> Black-box loss-threshold Membership Inference Attack (MIA)
  DEFEND  -> Differential Privacy (DP-SGD via Opacus) defense during training
  COMPARE -> Side-by-side empirical privacy vs utility trade-off evaluation
"""

import os
import json
import random
from typing import Dict, Any, Optional

import streamlit as st
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import torch

from config import FLMIAConfig
from model import create_model
from attack import attack_single
from experiment import run_experiment_pipeline


# -----------------------------------------------------------------------------
# Streamlit Page Configuration & Custom CSS Styling
# -----------------------------------------------------------------------------
st.set_page_config(
    page_title="FL-MIA: Federated Learning & Privacy Defense Demo",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom dark-theme styling with modern glassmorphic cards and typography
st.markdown(
    """
    <style>
    /* Global font & background enhancements */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
    }

    .main-header {
        font-size: 2.1rem;
        font-weight: 700;
        background: linear-gradient(135deg, #60A5FA 0%, #A78BFA 50%, #F472B6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.2rem;
    }
    
    .sub-header {
        color: #94A3B8;
        font-size: 1.05rem;
        margin-bottom: 1.5rem;
    }

    /* Client Card Styling */
    .client-card {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 12px;
        padding: 16px;
        text-align: center;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .client-card:hover {
        transform: translateY(-2px);
        border-color: rgba(96, 165, 250, 0.6);
    }
    .client-title {
        font-weight: 600;
        font-size: 1.05rem;
        color: #E2E8F0;
        margin-bottom: 6px;
    }
    .client-stat {
        font-size: 0.85rem;
        color: #94A3B8;
        margin-bottom: 8px;
    }
    .client-badge {
        display: inline-block;
        background: rgba(16, 185, 129, 0.15);
        color: #34D399;
        font-size: 0.75rem;
        padding: 3px 8px;
        border-radius: 9999px;
        font-weight: 500;
        border: 1px solid rgba(52, 211, 153, 0.3);
    }

    /* Tab Message Banner */
    .tab-caption-box {
        background: rgba(59, 130, 246, 0.08);
        border-left: 4px solid #3B82F6;
        padding: 12px 18px;
        border-radius: 4px 10px 10px 4px;
        margin-bottom: 1.5rem;
        font-size: 1.0rem;
        color: #CBD5E1;
        font-style: italic;
    }

    /* Defense Shield Badge */
    .shield-badge {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.3) 100%);
        border: 1px solid #10B981;
        border-radius: 10px;
        padding: 12px 20px;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        color: #A7F3D0;
        font-weight: 600;
        font-size: 1.1rem;
        margin-bottom: 1rem;
    }

    /* Limitations Box */
    .limitations-box {
        background: rgba(245, 158, 11, 0.08);
        border: 1px solid rgba(245, 158, 11, 0.4);
        border-radius: 12px;
        padding: 20px;
        margin-top: 2rem;
    }
    .limitations-title {
        color: #FBBF24;
        font-weight: 700;
        font-size: 1.15rem;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .limitations-item {
        font-size: 0.92rem;
        color: #E2E8F0;
        margin-bottom: 8px;
        line-height: 1.5;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


# -----------------------------------------------------------------------------
# Data & Model Caching Helpers
# -----------------------------------------------------------------------------
RESULTS_DIR = "./results"
SUMMARY_FILE = os.path.join(RESULTS_DIR, "summary.json")
CANDIDATES_FILE = os.path.join(RESULTS_DIR, "eval_candidates_seed0.json")
BASE_MODEL_FILE = os.path.join(RESULTS_DIR, "baseline_model_seed0.pt")
DP_MODEL_FILE = os.path.join(RESULTS_DIR, "dp_model_seed0.pt")


def load_summary() -> Optional[Dict[str, Any]]:
    """Loads experimental summary JSON file with automatic timestamp cache invalidation."""
    if os.path.exists(SUMMARY_FILE):
        mtime = os.path.getmtime(SUMMARY_FILE)
        return _load_summary_cached(mtime)
    return None


@st.cache_data
def _load_summary_cached(mtime: float) -> Optional[Dict[str, Any]]:
    with open(SUMMARY_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def load_candidates() -> Optional[list]:
    """Loads pre-cached candidate evaluation records with automatic timestamp cache invalidation."""
    if os.path.exists(CANDIDATES_FILE):
        mtime = os.path.getmtime(CANDIDATES_FILE)
        return _load_candidates_cached(mtime)
    return None


@st.cache_data
def _load_candidates_cached(mtime: float) -> Optional[list]:
    with open(CANDIDATES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def load_models() -> Dict[str, Any]:
    """Loads PyTorch SmallCNN models with automatic timestamp cache invalidation."""
    b_mtime = os.path.getmtime(BASE_MODEL_FILE) if os.path.exists(BASE_MODEL_FILE) else 0.0
    d_mtime = os.path.getmtime(DP_MODEL_FILE) if os.path.exists(DP_MODEL_FILE) else 0.0
    return _load_models_cached(b_mtime, d_mtime)


@st.cache_resource
def _load_models_cached(b_mtime: float, d_mtime: float) -> Dict[str, Any]:
    models: Dict[str, Any] = {}
    cfg = FLMIAConfig()

    if os.path.exists(BASE_MODEL_FILE):
        bm = create_model(cfg)
        bm.load_state_dict(torch.load(BASE_MODEL_FILE, map_location="cpu", weights_only=True))
        bm.eval()
        models["baseline"] = bm

    if os.path.exists(DP_MODEL_FILE):
        dm = create_model(cfg)
        dm.load_state_dict(torch.load(DP_MODEL_FILE, map_location="cpu", weights_only=True))
        dm.eval()
        models["dp"] = dm

    return models


# Initialize session state for interactive candidate attacks
if "candidate" not in st.session_state:
    st.session_state["candidate"] = None
if "revealed" not in st.session_state:
    st.session_state["revealed"] = False
if "tally" not in st.session_state:
    st.session_state["tally"] = {"total": 0, "correct": 0}


# -----------------------------------------------------------------------------
# Sidebar Configuration & Execution Controls
# -----------------------------------------------------------------------------
st.sidebar.markdown("## 🛡️ FL-MIA Control Center")

summary_data = load_summary()
candidates_data = load_candidates()
models_dict = load_models()

# Status Banner
if summary_data is not None:
    seed_count = len(summary_data.get("seeds", []))
    rounds = summary_data.get("config", {}).get("rounds", 30)
    st.sidebar.success(f"Cached results active\n({seed_count} seed(s), {rounds} rounds)")
else:
    st.sidebar.warning("No cached results found.")

st.sidebar.markdown("---")
st.sidebar.markdown("### ⚙️ Experiment Execution")

run_quick = st.sidebar.button("⚡ Run Quick Experiment (1 Seed, 10 Rounds)", use_container_width=True)
run_full = st.sidebar.button("🚀 Run Full Experiment (3 Seeds, 30 Rounds)", use_container_width=True)

if run_quick or run_full:
    cfg = FLMIAConfig()
    if run_quick:
        cfg.apply_quick_mode()
    
    with st.spinner(f"Running {'Quick' if run_quick else 'Full'} FL & MIA Experiment pipeline..."):
        run_experiment_pipeline(cfg)
        st.cache_data.clear()
        st.cache_resource.clear()
        st.rerun()

st.sidebar.markdown("---")
with st.sidebar.expander("📋 Experiment Hyperparameters", expanded=False):
    st.markdown(
        r"""
        - **Dataset**: Fashion-MNIST
        - **Clients**: 5 (600 records each = 3,000 members)
        - **Non-Members Pool**: 3,000 records
        - **Calibration Split**: 1,000 members + 1,000 non-members
        - **Evaluation Split**: 1,000 members + 1,000 non-members
        - **Global Test**: 2,000 records
        - **DP Mechanism**: DP-SGD (Opacus)
        - **Max Grad Norm ($C$)**: 1.0
        - **Noise Multiplier ($\sigma$)**: 1.0
        - **Delta ($\delta$)**: 1 / 600 (~0.00167)
        """
    )


# -----------------------------------------------------------------------------
# Header Presentation
# -----------------------------------------------------------------------------
st.markdown('<div class="main-header">FL-MIA: Federated Learning & DP Defense</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="sub-header">Evaluating Membership Inference Attacks on Federated Averaging and Demonstrating Differential Privacy Mitigation</div>',
    unsafe_allow_html=True,
)

if summary_data is None:
    st.info("👋 Welcome! No experiment results were found in `results/`. Please click **'⚡ Run Quick Experiment'** in the sidebar to generate results.")
    st.stop()


# -----------------------------------------------------------------------------
# 4 Main Tabs
# -----------------------------------------------------------------------------
tab_train, tab_attack, tab_defend, tab_compare = st.tabs([
    "1. TRAIN",
    "2. ATTACK",
    "3. DEFEND",
    "4. COMPARE",
])


# =============================================================================
# TAB 1: TRAIN
# =============================================================================
with tab_train:
    st.markdown(
        '<div class="tab-caption-box">'
        '"Clients collaborate to train one model without sharing raw records. '
        'That reduces direct data sharing, but does not automatically guarantee membership privacy."'
        '</div>',
        unsafe_allow_html=True,
    )

    st.markdown("### 🖥️ Federated Learning Topology (5 Distributed Clients)")
    cols = st.columns(5)
    for i in range(5):
        with cols[i]:
            st.markdown(
                f"""
                <div class="client-card">
                    <div style="font-size: 1.8rem; margin-bottom: 4px;">💻</div>
                    <div class="client-title">Client #{i+1}</div>
                    <div class="client-stat">Local: <b>600 records</b></div>
                    <div class="client-stat">Local Epochs: <b>2</b></div>
                    <div class="client-badge">🔒 Raw data never leaves</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

    st.markdown("---")
    st.markdown("### 📈 Baseline Training Progress (FedAvg without Differential Privacy)")

    base_hist = summary_data["seed0_details"]["baseline_history"]
    total_rounds = len(base_hist["round"]) - 1

    scrub_col1, scrub_col2 = st.columns([3, 1])
    with scrub_col1:
        scrub_round = st.slider(
            "Scrub through communication rounds:",
            min_value=1,
            max_value=total_rounds,
            value=total_rounds,
            key="scrub_round_slider",
        )

    # Metrics at scrubbed round
    r_idx = scrub_round  # index corresponds to round
    scrub_test_acc = base_hist["test_acc"][r_idx]
    scrub_test_loss = base_hist["test_loss"][r_idx]
    scrub_train_loss = base_hist["train_loss"][r_idx]

    m_col1, m_col2, m_col3, m_col4 = st.columns(4)
    m_col1.metric("Selected Round", f"Round {scrub_round} / {total_rounds}")
    m_col2.metric("Global Test Accuracy", f"{scrub_test_acc*100:.2f}%")
    m_col3.metric("Global Test Loss", f"{scrub_test_loss:.4f}")
    m_col4.metric("Avg Client Train Loss", f"{scrub_train_loss:.4f}")

    # Plotly Line Chart for Training History up to scrubbed round
    fig_train = make_subplots(
        rows=1, cols=2,
        subplot_titles=("Global Test Accuracy over Rounds", "Train Loss vs Test Loss (Generalization Gap)"),
        horizontal_spacing=0.1,
    )

    rounds_x = base_hist["round"][: scrub_round + 1]
    test_acc_y = [acc * 100 for acc in base_hist["test_acc"][: scrub_round + 1]]
    test_loss_y = base_hist["test_loss"][: scrub_round + 1]
    train_loss_y = base_hist["train_loss"][: scrub_round + 1]

    # Accuracy subplot
    fig_train.add_trace(
        go.Scatter(
            x=rounds_x, y=test_acc_y,
            mode="lines+markers",
            name="Test Accuracy (%)",
            line=dict(color="#3B82F6", width=2.5),
            marker=dict(size=5),
        ),
        row=1, col=1,
    )

    # Loss comparison subplot (illustrating overfitting gap)
    fig_train.add_trace(
        go.Scatter(
            x=rounds_x, y=train_loss_y,
            mode="lines+markers",
            name="Train Loss (Members)",
            line=dict(color="#10B981", width=2.5),
            marker=dict(size=5),
        ),
        row=1, col=2,
    )
    fig_train.add_trace(
        go.Scatter(
            x=rounds_x, y=test_loss_y,
            mode="lines+markers",
            name="Test Loss (General)",
            line=dict(color="#F43F5E", width=2.5, dash="dash"),
            marker=dict(size=5),
        ),
        row=1, col=2,
    )

    fig_train.update_layout(
        template="plotly_dark",
        height=380,
        margin=dict(l=40, r=40, t=50, b=40),
        legend=dict(orientation="h", yanchor="bottom", y=-0.3, xanchor="center", x=0.5),
    )
    fig_train.update_xaxes(title_text="Communication Round", row=1, col=1)
    fig_train.update_xaxes(title_text="Communication Round", row=1, col=2)
    fig_train.update_yaxes(title_text="Accuracy (%)", row=1, col=1)
    fig_train.update_yaxes(title_text="Cross-Entropy Loss", row=1, col=2)

    st.plotly_chart(fig_train, use_container_width=True)

    st.info(
        "💡 **Key Insight**: While clients never expose their raw images to the central server or peers, "
        "the resulting global model fits training members more tightly than unseen testing records. "
        "This loss difference is the exact vulnerability exploited in the next tab."
    )


# =============================================================================
# TAB 2: ATTACK
# =============================================================================
with tab_attack:
    st.markdown(
        '<div class="tab-caption-box">'
        '"The attacker never sees the training set; it only uses how the model behaves on a candidate."'
        '</div>',
        unsafe_allow_html=True,
    )

    st.markdown("### 🎯 Interactive Black-Box Membership Inference Prober")
    st.write(
        r"Query candidate images from the evaluation split against the released baseline FL model. "
        r"The attacker observes only the candidate $(x, y)$ and model outputs (confidence & loss), "
        r"predicting **Member** if $\text{score} = -\text{loss} \ge \tau$."
    )

    base_thresh = summary_data["seed0_details"]["baseline_threshold"]
    bm = models_dict.get("baseline")

    col_btn1, col_btn2, col_tally = st.columns([1.5, 1.5, 3])
    with col_btn1:
        if st.button("🎲 Pick a Random Candidate", use_container_width=True):
            if candidates_data:
                st.session_state["candidate"] = random.choice(candidates_data)
                st.session_state["revealed"] = False

    with col_btn2:
        if st.session_state["candidate"] is not None and not st.session_state["revealed"]:
            if st.button("🔍 Reveal Ground Truth", use_container_width=True):
                st.session_state["revealed"] = True
                # Update tally
                cand = st.session_state["candidate"]
                img_t = torch.tensor(cand["image"], dtype=torch.float32).unsqueeze(0)
                attack_res = attack_single(bm, img_t, cand["label"], threshold=base_thresh)
                pred_member = 1 if attack_res["guess"] == "Member" else 0
                is_correct = (pred_member == cand["is_member"])
                st.session_state["tally"]["total"] += 1
                if is_correct:
                    st.session_state["tally"]["correct"] += 1

    with col_tally:
        tot = st.session_state["tally"]["total"]
        corr = st.session_state["tally"]["correct"]
        tally_acc = (corr / tot * 100) if tot > 0 else 0.0
        st.markdown(
            f"**Attacker Tally**: {corr} / {tot} correct guesses (**{tally_acc:.1f}% accuracy**)"
        )

    # Display candidate if selected
    if st.session_state["candidate"] is not None and bm is not None:
        cand = st.session_state["candidate"]
        img_arr = np.array(cand["image"])
        img_t = torch.tensor(img_arr, dtype=torch.float32).unsqueeze(0)

        # Attacker query (Hygiene: does NOT receive is_member!)
        attack_res = attack_single(bm, img_t, cand["label"], threshold=base_thresh)

        c_view1, c_view2 = st.columns([1, 2])
        with c_view1:
            st.markdown(f"**Candidate Image** (`{cand['label_name']}`)")
            fig_img = px.imshow(
                img_arr,
                color_continuous_scale="gray",
                aspect="equal",
            )
            fig_img.update_layout(
                coloraxis_showscale=False,
                margin=dict(l=0, r=0, t=0, b=0),
                height=220,
                width=220,
                xaxis=dict(showticklabels=False),
                yaxis=dict(showticklabels=False),
            )
            st.plotly_chart(fig_img, use_container_width=False)

        with c_view2:
            st.markdown("#### 🕵️ Attacker Query Observations")
            q_col1, q_col2, q_col3 = st.columns(3)
            q_col1.metric("Predicted Class", f"{attack_res['predicted_label']}")
            q_col2.metric("Confidence", f"{attack_res['confidence']*100:.2f}%")
            q_col3.metric("Sample Loss", f"{attack_res['loss']:.4f}")

            st.markdown(
                f"- **Attacker Score ($-loss$)**: `{attack_res['score']:.4f}`\n"
                f"- **Calibrated Threshold ($\\tau$)**: `{attack_res['threshold']:.4f}`\n"
                f"- **Attacker Guess**: **`{attack_res['guess']}`**"
            )

            if st.session_state["revealed"]:
                actual_status = "Member (was in client training set)" if cand["is_member"] == 1 else "Non-member (never seen during training)"
                pred_member = 1 if attack_res["guess"] == "Member" else 0
                is_correct = (pred_member == cand["is_member"])

                if is_correct:
                    st.success(f"🎯 **CORRECT GUESS!** Actual: **{actual_status}**")
                else:
                    st.error(f"❌ **INCORRECT GUESS!** Actual: **{actual_status}**")
            else:
                st.info("🔒 True membership label is currently hidden. Click **'Reveal Ground Truth'** to verify.")

    st.markdown("---")
    st.markdown("### 📊 Global Attack Analytics (Baseline Model)")

    base_attack_info = summary_data["seed0_details"]["baseline_attack"]
    member_losses = base_attack_info["member_losses"]
    nonmember_losses = base_attack_info["nonmember_losses"]

    col_chart1, col_chart2 = st.columns(2)

    with col_chart1:
        st.markdown(f"**Member vs Non-Member Loss Distribution** ($\\tau = {base_thresh:.3f}$)")
        fig_hist = go.Figure()
        fig_hist.add_trace(
            go.Histogram(
                x=member_losses,
                name="Members (Training Data)",
                marker_color="#10B981",
                opacity=0.65,
                nbinsx=40,
            )
        )
        fig_hist.add_trace(
            go.Histogram(
                x=nonmember_losses,
                name="Non-Members (Unseen)",
                marker_color="#F43F5E",
                opacity=0.65,
                nbinsx=40,
            )
        )
        # Vertical decision threshold line (loss = -tau)
        fig_hist.add_vline(
            x=-base_thresh,
            line_width=2.5,
            line_dash="dash",
            line_color="#FBBF24",
            annotation_text=f"Decision Cutoff (loss={-base_thresh:.2f})",
            annotation_position="top right",
        )
        fig_hist.update_layout(
            barmode="overlay",
            template="plotly_dark",
            height=340,
            margin=dict(l=30, r=30, t=30, b=30),
            xaxis_title="Cross-Entropy Loss",
            yaxis_title="Sample Count",
            legend=dict(orientation="h", yanchor="bottom", y=-0.3, xanchor="center", x=0.5),
        )
        st.plotly_chart(fig_hist, use_container_width=True)

    with col_chart2:
        auc_val = base_attack_info["roc_auc"]
        st.markdown(f"**MIA ROC Curve** (Evaluation Split AUC: **{auc_val:.4f}**)")
        fpr = base_attack_info["roc_curve"]["fpr"]
        tpr = base_attack_info["roc_curve"]["tpr"]

        fig_roc = go.Figure()
        fig_roc.add_trace(
            go.Scatter(
                x=fpr, y=tpr,
                mode="lines",
                name=f"Baseline MIA (AUC = {auc_val:.3f})",
                line=dict(color="#3B82F6", width=2.5),
            )
        )
        fig_roc.add_trace(
            go.Scatter(
                x=[0, 1], y=[0, 1],
                mode="lines",
                name="Random Guess (AUC = 0.50)",
                line=dict(color="#94A3B8", dash="dash"),
            )
        )
        fig_roc.update_layout(
            template="plotly_dark",
            height=340,
            margin=dict(l=30, r=30, t=30, b=30),
            xaxis_title="False Positive Rate (FPR)",
            yaxis_title="True Positive Rate (TPR)",
            legend=dict(orientation="h", yanchor="bottom", y=-0.3, xanchor="center", x=0.5),
        )
        st.plotly_chart(fig_roc, use_container_width=True)


# =============================================================================
# TAB 3: DEFEND
# =============================================================================
with tab_defend:
    st.markdown(
        '<div class="tab-caption-box">'
        '"We changed the training process, not the chart."'
        '</div>',
        unsafe_allow_html=True,
    )

    st.markdown(
        '<div class="shield-badge">🛡️ Protected Model (DP-SGD via Opacus PrivacyEngine)</div>',
        unsafe_allow_html=True,
    )

    dp_hist = summary_data["seed0_details"]["dp_history"]
    final_eps = dp_hist["epsilon"][-1]
    target_delta = summary_data["config"]["delta"]

    # DP Settings Cards
    dp_c1, dp_c2, dp_c3, dp_c4 = st.columns(4)
    dp_c1.metric("Max Grad Norm (C)", f"{summary_data['config']['max_grad_norm']:.1f}")
    dp_c2.metric("Noise Multiplier (σ)", f"{summary_data['config']['noise_multiplier']:.1f}")
    dp_c3.metric("Target Delta (δ)", f"{target_delta:.5f}")
    dp_c4.metric("Headline Epsilon (ε)", f"{final_eps:.2f}")

    st.markdown("---")
    st.markdown("### 📈 DP-SGD Training Trajectory & Privacy Accumulation")

    fig_dp = make_subplots(
        rows=1, cols=2,
        subplot_titles=("Global Test Accuracy (DP-SGD)", "Cumulative Privacy Budget ε over Rounds"),
        horizontal_spacing=0.1,
    )

    dp_rounds = dp_hist["round"][1:]
    dp_acc = [a * 100 for a in dp_hist["test_acc"][1:]]
    dp_eps_list = dp_hist["epsilon"][1:]

    fig_dp.add_trace(
        go.Scatter(
            x=dp_rounds, y=dp_acc,
            mode="lines+markers",
            name="DP Test Acc (%)",
            line=dict(color="#10B981", width=2.5),
        ),
        row=1, col=1,
    )

    fig_dp.add_trace(
        go.Scatter(
            x=dp_rounds, y=dp_eps_list,
            mode="lines+markers",
            name="Epsilon (ε)",
            line=dict(color="#8B5CF6", width=2.5),
        ),
        row=1, col=2,
    )

    fig_dp.update_layout(
        template="plotly_dark",
        height=380,
        margin=dict(l=40, r=40, t=50, b=40),
        legend=dict(orientation="h", yanchor="bottom", y=-0.3, xanchor="center", x=0.5),
    )
    fig_dp.update_xaxes(title_text="Communication Round", row=1, col=1)
    fig_dp.update_xaxes(title_text="Communication Round", row=1, col=2)
    fig_dp.update_yaxes(title_text="Accuracy (%)", row=1, col=1)
    fig_dp.update_yaxes(title_text="Privacy Loss ε", row=1, col=2)

    st.plotly_chart(fig_dp, use_container_width=True)

    st.markdown("---")
    st.markdown("### 🔬 Test the Same Candidate on the DP-SGD Model")

    dp_model = models_dict.get("dp")
    base_model = models_dict.get("baseline")

    if st.session_state["candidate"] is not None and dp_model is not None and base_model is not None:
        cand = st.session_state["candidate"]
        img_arr = np.array(cand["image"])
        img_t = torch.tensor(img_arr, dtype=torch.float32).unsqueeze(0)

        dp_thresh = summary_data["seed0_details"]["dp_threshold"]
        base_thresh = summary_data["seed0_details"]["baseline_threshold"]

        # Run attack on both models with the exact same candidate
        res_b = attack_single(base_model, img_t, cand["label"], threshold=base_thresh)
        res_dp = attack_single(dp_model, img_t, cand["label"], threshold=dp_thresh)

        comp_col1, comp_col2 = st.columns(2)
        with comp_col1:
            st.markdown("#### ❌ Baseline Model (Unprotected)")
            st.markdown(
                f"- **Predicted**: `{res_b['predicted_label']}` (Conf: `{res_b['confidence']*100:.1f}%`)\n"
                f"- **Loss**: `{res_b['loss']:.4f}` | **Score**: `{res_b['score']:.4f}`\n"
                f"- **Attacker Guess**: **`{res_b['guess']}`**"
            )

        with comp_col2:
            st.markdown("#### 🛡️ DP-SGD Model (Protected)")
            st.markdown(
                f"- **Predicted**: `{res_dp['predicted_label']}` (Conf: `{res_dp['confidence']*100:.1f}%`)\n"
                f"- **Loss**: `{res_dp['loss']:.4f}` | **Score**: `{res_dp['score']:.4f}`\n"
                f"- **Attacker Guess**: **`{res_dp['guess']}`**"
            )

        if st.session_state["revealed"]:
            actual_text = "Member (Training Set)" if cand["is_member"] == 1 else "Non-member (Unseen)"
            st.info(f"Actual Candidate Ground Truth: **{actual_text}**")
    else:
        st.write("Go to **Tab 2 (ATTACK)** and pick a candidate to test it against both models here.")


# =============================================================================
# TAB 4: COMPARE
# =============================================================================
with tab_compare:
    st.markdown(
        '<div class="tab-caption-box">'
        '"By modifying client gradient updates with clipping and Gaussian noise, '
        'DP-SGD substantially reduces membership leakage at an acceptable utility cost."'
        '</div>',
        unsafe_allow_html=True,
    )

    st.markdown("### 📋 Side-by-Side Performance Comparison")

    agg = summary_data["aggregate"]
    b_agg = agg["baseline"]
    d_agg = agg["dp"]

    # Summary Comparison Table
    comp_df = pd.DataFrame([
        {
            "Metric": "Attack ROC-AUC (Lower is safer)",
            "Baseline (No DP)": f"{b_agg['attack_auc_mean']:.4f} ± {b_agg['attack_auc_std']:.4f}",
            "DP-SGD Model": f"{d_agg['attack_auc_mean']:.4f} ± {d_agg['attack_auc_std']:.4f}",
            "Privacy Impact": f"{- (b_agg['attack_auc_mean'] - d_agg['attack_auc_mean']):.4f} (closer to 0.50)",
        },
        {
            "Metric": "Attack Accuracy @ Calibrated Tau",
            "Baseline (No DP)": f"{b_agg['attack_acc_mean']*100:.2f}% ± {b_agg['attack_acc_std']*100:.2f}%",
            "DP-SGD Model": f"{d_agg['attack_acc_mean']*100:.2f}% ± {d_agg['attack_acc_std']*100:.2f}%",
            "Privacy Impact": f"{(d_agg['attack_acc_mean'] - b_agg['attack_acc_mean'])*100:+.2f}%",
        },
        {
            "Metric": "Attack TPR @ 1% FPR",
            "Baseline (No DP)": f"{b_agg['tpr_at_1_fpr_mean']*100:.2f}% ± {b_agg['tpr_at_1_fpr_std']*100:.2f}%",
            "DP-SGD Model": f"{d_agg['tpr_at_1_fpr_mean']*100:.2f}% ± {d_agg['tpr_at_1_fpr_std']*100:.2f}%",
            "Privacy Impact": f"{(d_agg['tpr_at_1_fpr_mean'] - b_agg['tpr_at_1_fpr_mean'])*100:+.2f}%",
        },
        {
            "Metric": "Global Test Accuracy (Utility)",
            "Baseline (No DP)": f"{b_agg['test_acc_mean']*100:.2f}% ± {b_agg['test_acc_std']*100:.2f}%",
            "DP-SGD Model": f"{d_agg['test_acc_mean']*100:.2f}% ± {d_agg['test_acc_std']*100:.2f}%",
            "Privacy Impact": f"{(d_agg['test_acc_mean'] - b_agg['test_acc_mean'])*100:.2f}% accuracy trade-off",
        },
        {
            "Metric": "Global Test Loss",
            "Baseline (No DP)": f"{b_agg['test_loss_mean']:.4f} ± {b_agg['test_loss_std']:.4f}",
            "DP-SGD Model": f"{d_agg['test_loss_mean']:.4f} ± {d_agg['test_loss_std']:.4f}",
            "Privacy Impact": f"{d_agg['test_loss_mean'] - b_agg['test_loss_mean']:+.4f}",
        },
        {
            "Metric": "Formal Privacy Epsilon (ε)",
            "Baseline (No DP)": "∞ (No formal guarantee)",
            "DP-SGD Model": f"{d_agg['epsilon_mean']:.2f} ± {d_agg['epsilon_std']:.2f}",
            "Privacy Impact": f"Provable (ε={d_agg['epsilon_mean']:.2f}, δ={d_agg['delta']:.5f})",
        },
    ])

    st.dataframe(comp_df, hide_index=True, use_container_width=True)

    st.markdown("---")
    st.markdown("### 📉 Overlaid ROC Curves (Baseline vs DP-SGD)")

    b_roc = summary_data["seed0_details"]["baseline_attack"]["roc_curve"]
    d_roc = summary_data["seed0_details"]["dp_attack"]["roc_curve"]
    b_auc = summary_data["seed0_details"]["baseline_attack"]["roc_auc"]
    d_auc = summary_data["seed0_details"]["dp_attack"]["roc_auc"]

    fig_comp_roc = go.Figure()
    fig_comp_roc.add_trace(
        go.Scatter(
            x=b_roc["fpr"], y=b_roc["tpr"],
            mode="lines",
            name=f"Baseline Model (AUC = {b_auc:.3f})",
            line=dict(color="#F43F5E", width=3),
        )
    )
    fig_comp_roc.add_trace(
        go.Scatter(
            x=d_roc["fpr"], y=d_roc["tpr"],
            mode="lines",
            name=f"DP-SGD Protected (AUC = {d_auc:.3f})",
            line=dict(color="#10B981", width=3),
        )
    )
    fig_comp_roc.add_trace(
        go.Scatter(
            x=[0, 1], y=[0, 1],
            mode="lines",
            name="Random Guess / Ideal Privacy (AUC = 0.50)",
            line=dict(color="#94A3B8", dash="dash", width=1.5),
        )
    )
    fig_comp_roc.update_layout(
        template="plotly_dark",
        height=380,
        margin=dict(l=40, r=40, t=30, b=40),
        xaxis_title="False Positive Rate (FPR)",
        yaxis_title="True Positive Rate (TPR)",
        legend=dict(orientation="h", yanchor="bottom", y=-0.3, xanchor="center", x=0.5),
    )
    st.plotly_chart(fig_comp_roc, use_container_width=True)

    # Noise sweep trade-off chart if available
    noise_sweep = summary_data.get("noise_sweep", [])
    if noise_sweep:
        st.markdown("---")
        st.markdown("### ⚖️ Privacy-Utility Trade-Off (Noise Multiplier Sweep)")

        sw_df = pd.DataFrame(noise_sweep)
        sw_col1, sw_col2 = st.columns([1, 2])
        with sw_col1:
            st.dataframe(
                sw_df[["noise_multiplier", "epsilon", "test_acc", "attack_auc"]].rename(
                    columns={
                        "noise_multiplier": "σ",
                        "epsilon": "ε",
                        "test_acc": "Test Acc",
                        "attack_auc": "Attack AUC",
                    }
                ),
                hide_index=True,
                use_container_width=True,
            )

        with sw_col2:
            fig_sw = make_subplots(specs=[[{"secondary_y": True}]])
            fig_sw.add_trace(
                go.Scatter(
                    x=sw_df["noise_multiplier"],
                    y=[a * 100 for a in sw_df["test_acc"]],
                    name="Test Accuracy (%)",
                    mode="lines+markers",
                    line=dict(color="#3B82F6", width=2.5),
                ),
                secondary_y=False,
            )
            fig_sw.add_trace(
                go.Scatter(
                    x=sw_df["noise_multiplier"],
                    y=sw_df["attack_auc"],
                    name="Attack AUC",
                    mode="lines+markers",
                    line=dict(color="#F59E0B", width=2.5),
                ),
                secondary_y=True,
            )
            fig_sw.update_layout(
                template="plotly_dark",
                height=300,
                margin=dict(l=20, r=20, t=20, b=20),
                xaxis_title="Noise Multiplier (σ)",
                legend=dict(orientation="h", yanchor="bottom", y=-0.3, xanchor="center", x=0.5),
            )
            fig_sw.update_yaxes(title_text="Test Accuracy (%)", secondary_y=False)
            fig_sw.update_yaxes(title_text="Attack AUC", secondary_y=True)
            st.plotly_chart(fig_sw, use_container_width=True)

    # -------------------------------------------------------------------------
    # Honest Limitations Box
    # -------------------------------------------------------------------------
    st.markdown(
        """
        <div class="limitations-box">
            <div class="limitations-title">⚠️ Honest Limitations & Nuances</div>
            <div class="limitations-item">
                <b>1. DP mitigates, but does not eradicate all leakage:</b> At smaller noise multipliers (e.g. &sigma; &le; 0.5), residual membership signal remains detectable by empirical attacks.
            </div>
            <div class="limitations-item">
                <b>2. Scope of Differential Privacy:</b> The &epsilon; reported represents record-level DP with respect to each individual client's local dataset (&delta; = 1/600), composed across all FL communication rounds using Opacus' RDP/PRV accountant.
            </div>
            <div class="limitations-item">
                <b>3. Attacker Threat Model:</b> The evaluation assumes a black-box attacker who queries the released global model with loss queries. Stronger white-box attackers with access to intermediate client updates could theoretically extract additional signal.
            </div>
            <div class="limitations-item">
                <b>4. Secure Aggregation vs DP:</b> Secure Aggregation (SecAgg) protects model updates <i>in transit</i> from clients to the server, but offers ZERO protection for the released final model! Only Differential Privacy modifies the training mechanics to prevent the model from memorizing individual records.
            </div>
            <div class="limitations-item">
                <b>5. Scale of Experiment:</b> This project is intentionally sized for fast, reproducible laptop execution in &lt; 10 minutes on CPU using Fashion-MNIST. Production cross-device federated deployments involve thousands of non-IID clients and larger networks.
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

export interface ModelPrediction {
  predicted_class: number;
  predicted_label: string;
  confidence: number;
  loss: number;
  score: number;
  guess: "Member" | "Non-member";
  is_correct: boolean;
}

export interface Candidate {
  id: number;
  orig_idx: number;
  label: number;
  label_name: string;
  is_member: number;
  image: number[][];
  baseline: ModelPrediction;
  dp: ModelPrediction;
}

export interface TrainingHistory {
  round: number[];
  train_loss: number[];
  test_loss: number[];
  test_acc: number[];
}

export interface DpHistory extends TrainingHistory {
  epsilon: number[];
}

export interface RocCurve {
  fpr: number[];
  tpr: number[];
}

export interface AttackMetrics {
  roc_auc: number;
  attack_accuracy: number;
  tpr_at_1_fpr: number;
  calibrated_threshold: number;
  mean_member_loss: number;
  std_member_loss: number;
  mean_nonmember_loss: number;
  std_nonmember_loss: number;
  member_losses: number[];
  nonmember_losses: number[];
  roc_curve: RocCurve;
}

export interface AggMetrics {
  test_acc_mean: number;
  test_acc_std: number;
  test_loss_mean: number;
  test_loss_std: number;
  attack_auc_mean: number;
  attack_auc_std: number;
  attack_acc_mean: number;
  attack_acc_std: number;
  tpr_at_1_fpr_mean: number;
  tpr_at_1_fpr_std: number;
  epsilon_mean?: number;
  epsilon_std?: number;
  delta?: number;
}

export interface NoiseSweepItem {
  noise_multiplier: number;
  epsilon: number;
  test_acc: number;
  attack_auc: number;
}

export interface ExperimentConfig {
  num_clients: number;
  client_samples: number;
  nonmembers_pool_size: number;
  attack_calibration_size: number;
  attack_eval_size: number;
  global_test_size: number;
  rounds: number;
  local_epochs: number;
  batch_size: number;
  lr: number;
  momentum: number;
  max_grad_norm: number;
  noise_multiplier: number;
  delta: number;
  seeds: number[];
}

export interface SummaryData {
  config: ExperimentConfig;
  aggregate: {
    baseline: AggMetrics;
    dp: AggMetrics;
  };
  seeds: number[];
  noise_sweep: NoiseSweepItem[];
  seed0_details: {
    baseline_history: TrainingHistory;
    dp_history: DpHistory;
    baseline_attack: AttackMetrics;
    dp_attack: AttackMetrics;
    baseline_threshold: number;
    dp_threshold: number;
  };
}

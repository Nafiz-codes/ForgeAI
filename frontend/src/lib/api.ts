/**
 * ForgeAI — Shared API types and helpers
 * All fetch calls in the frontend go through /api/* which Next.js proxies
 * to the FastAPI backend at http://localhost:8000.
 */

// ── Types matching the backend response shapes ──────────────────────────────

export interface ColumnAnalysis {
  name: string;
  type: string;
  missing_pct: number;
  unique_count: number;
  flag: string;
  flagClass: string;
}

export interface UploadResponse {
  dataset_id: string;
  rows: number;
  columns: number;
  missing_total: number;
  duplicate_rows: number;
  memory_mb: number;
  health_score: number;
  possible_task: string;
  target_column: string | null;
  preview: Record<string, string | number | null>[];
  column_analysis: ColumnAnalysis[];
  ai_summary: string | null;
  ai_available: boolean;
}

export interface PlanAction {
  id: number;
  column: string;
  action: string;
  category: string;
  reason: string;
  confidence: number;
  type: string;
}

export interface MlRecommendation {
  model: string;
  type: string;
  suitability: number;
  reason: string;
  pros: string[];
}

export interface PlanResponse {
  dataset_id: string;
  health_score_before: number;
  predicted_health_score: number;
  summary: string;
  actions: PlanAction[];
  ml_recommendations: MlRecommendation[];
}

export interface DecisionLogEntry {
  action: string;
  column?: string;
  reason: string;
  impact: string;
  time_ms: number;
  status: string;
}

export interface ExecuteResponse {
  job_id: string;
  status: string;
  dataset_name: string;
  rows_before: number;
  rows_after: number;
  columns_before: number;
  columns_after: number;
  health_score_before: number;
  health_score_after: number;
  completeness_score: number;
  consistency_score: number;
  ml_readiness_score: number;
  actions_applied: number;
  decision_log: DecisionLogEntry[];
  ml_recommendations: MlRecommendation[];
  pipeline_code: string;
}

// ── sessionStorage keys ─────────────────────────────────────────────────────

export const SESSION_KEYS = {
  DATASET_ID: "forgeai_dataset_id",
  UPLOAD:     "forgeai_upload",    // UploadResponse JSON
  RESULTS:    "forgeai_results",   // ExecuteResponse JSON
} as const;

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Trigger a browser file download for a backend artifact.
 * Creates a temporary hidden <a> element, fetches the blob, and clicks it.
 */
export async function downloadArtifact(
  datasetId: string,
  type: "csv" | "pipeline" | "report",
  filename?: string
): Promise<void> {
  const url = `/api/artifacts/${datasetId}/${type}`;

  if (type === "report") {
    window.open(url, "_blank");
    return;
  }

  // Direct anchor approach — avoids the revokeObjectURL race condition.
  // FastAPI's FileResponse sends Content-Disposition: attachment, so the
  // browser treats this as a file download rather than navigation.
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? (type === "csv" ? "clean.csv" : "pipeline.py");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

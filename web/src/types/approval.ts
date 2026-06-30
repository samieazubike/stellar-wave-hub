export type ApprovalAction = "feature" | "unfeature" | "delete";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ApprovalRequest {
  id: number;
  project_id: number;
  action_type: ApprovalAction;
  requested_by: number;
  status: ApprovalStatus;
  reason?: string;
  reviewer_id?: number;
  reviewer_note?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  // Enriched fields from API
  project_name?: string;
  project_slug?: string;
  requester_username?: string;
  reviewer_username?: string;
}

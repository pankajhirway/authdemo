/**
 * API type definitions matching the backend FastAPI responses.
 */

/**
 * User roles in the system.
 */
export type UserRole = "operator" | "supervisor" | "auditor" | "admin";

/**
 * Data entry status in the workflow.
 */
export type DataEntryStatus =
  | "draft"
  | "submitted"
  | "confirmed"
  | "rejected"
  | "cancelled";

/**
 * Token data extracted from JWT.
 * Matches the backend TokenData model.
 */
export interface TokenData {
  user_id: string;
  username: string;
  email?: string;
  role: UserRole;
  scopes: string[];
  client_id: string;
  exp: number;
  iat: number;
  iss: string;
  aud?: string;
}

/**
 * API error response from FastAPI.
 */
export interface ApiError {
  detail: string;
  status?: number;
}

/**
 * Data entry response from the API.
 * Matches the filtered response returned to operators.
 */
export interface DataEntry {
  entry_id: string;
  data: Record<string, unknown>;
  status: DataEntryStatus;
  created_at: string;
  updated_at: string;
  created_by_username: string;
  // Fields that may be null based on role filtering
  confirmed_by_username?: string | null;
  rejected_by_username?: string | null;
  rejected_reason?: string | null;
}

/**
 * Create data entry request.
 */
export interface CreateDataEntryRequest {
  data: Record<string, unknown>;
  entry_type?: string;
}

/**
 * Create data entry response.
 */
export interface CreateDataEntryResponse {
  entry_id: string;
  event_id: string;
  status: DataEntryStatus;
  created_at: string;
}

/**
 * Update data entry request.
 */
export interface UpdateDataEntryRequest {
  data: Record<string, unknown>;
}

/**
 * Update data entry response.
 */
export interface UpdateDataEntryResponse {
  event_id: string;
  updated_at: string;
}

/**
 * Submit data entry response.
 */
export interface SubmitDataEntryResponse {
  event_id: string;
  status: DataEntryStatus;
  submitted_at: string;
}

/**
 * Confirm data entry response (supervisor).
 */
export interface ConfirmDataEntryResponse {
  event_id: string;
  status: DataEntryStatus;
  confirmed_at: string;
}

/**
 * Reject data entry request (supervisor).
 */
export interface RejectDataEntryRequest {
  reason: string;
}

/**
 * Reject data entry response (supervisor).
 */
export interface RejectDataEntryResponse {
  event_id: string;
  status: DataEntryStatus;
  rejected_at: string;
}

/**
 * List data entries response.
 */
export interface ListDataEntriesResponse {
  items: DataEntry[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Query parameters for listing data entries.
 */
export interface ListDataEntriesParams {
  status?: DataEntryStatus;
  limit?: number;
  offset?: number;
}

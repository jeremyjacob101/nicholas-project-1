import type { Response } from "express";
import type { CurrentUserLocals } from "./user.ts";

export type CurrentUserResponse = Response<unknown, CurrentUserLocals>;

export type UploadStatus =
  "uploaded" | "queued" | "processing" | "completed" | "failed";

export type UploadConfirmationState = "completed" | "queued" | "unavailable";

export type StoredImageValidationResult =
  { valid: true } | { valid: false; error: string };

export type ConfirmUploadResult =
  | { kind: "not-found" }
  | { kind: "completed"; id: string; status: "completed" }
  | { kind: "unavailable" }
  | { kind: "missing-object" }
  | { kind: "storage-error" }
  | { kind: "invalid-image"; error: string }
  | { kind: "already-processing" }
  | { kind: "processing-error" };

export type CreateUploadInput = {
  sample_id: string;
  filename: string;
  classification: string;
};

export type InitiateUploadInput = CreateUploadInput & {
  content_type: string;
  content_length: number;
};

export type CreateUploadRecordInput = CreateUploadInput & {
  id: string;
  safe_filename: string;
  company_id: string;
  created_by_user_id: string;
  object_key: string;
};

export type UploadRecord = CreateUploadInput & {
  id: string;
  safe_filename: string;
  company_id: string;
  created_by_user_id: string;
  object_key: string;
  status: UploadStatus;
  created_at: string;
  updated_at: string;
};

export type AuthorizedUpload = Pick<
  UploadRecord,
  "id" | "sample_id" | "filename" | "classification" | "status" | "created_at"
>;

export type UploadsState = {
  userId: string;
  refreshVersion: number;
  uploads: AuthorizedUpload[];
  error: string | null;
};

export const initialUploadsState: UploadsState = {
  userId: "",
  refreshVersion: 0,
  uploads: [],
  error: null,
};

export type CreatedUpload = Pick<UploadRecord, "id" | "status">;

export type InitiatedUpload = {
  upload: CreatedUpload;
  uploadUrl: string;
  expiresAt: string;
};

export type PresignedDownload = {
  downloadUrl: string;
  expiresAt: string;
};

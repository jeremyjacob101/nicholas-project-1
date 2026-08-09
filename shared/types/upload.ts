export type UploadStatus =
  "uploaded" | "queued" | "processing" | "completed" | "failed";

export type CreateUploadInput = {
  sample_id: string;
  filename: string;
  classification: string;
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

export type CreatedUpload = Pick<UploadRecord, "id" | "status">;

import type { CreatedUpload, CreateUploadInput } from "../types/upload.js";

export type UploadFormProps = {
  isSubmitting: boolean;
  error: string | null;
  disabled: boolean;
  onSubmit: (values: CreateUploadInput, file: File) => void;
};

export type UploadRecordSummaryProps = {
  upload: CreatedUpload | null;
};

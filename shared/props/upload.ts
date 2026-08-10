import type {
  AuthorizedUpload,
  CreatedUpload,
  CreateUploadInput,
} from "../types/upload.ts";

export type UploadFormProps = {
  isSubmitting: boolean;
  error: string | null;
  disabled: boolean;
  onSubmit: (values: CreateUploadInput, file: File) => void;
};

export type UploadRecordSummaryProps = {
  upload: CreatedUpload | null;
};

export type UploadListProps = {
  uploads: AuthorizedUpload[];
  isLoading: boolean;
  error: string | null;
};

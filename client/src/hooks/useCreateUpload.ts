import { createUploadRecord } from "../api/uploads.api";
import type {
  CreatedUpload,
  CreateUploadInput,
} from "../../../shared/types/upload";
import { useState } from "react";

export function useCreateUpload() {
  const [upload, setUpload] = useState<CreatedUpload | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitUpload(
    input: CreateUploadInput,
    userId: string,
  ): Promise<CreatedUpload | null> {
    setIsCreating(true);
    setError(null);
    setUpload(null);

    try {
      const createdUpload = await createUploadRecord(input, userId);
      setUpload(createdUpload);
      return createdUpload;
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create upload",
      );
      return null;
    } finally {
      setIsCreating(false);
    }
  }

  return { upload, isCreating, error, submitUpload };
}

import { createUploadRecord } from "../api/uploads.api";
import { useCallback, useState } from "react";
import type {
  CreatedUpload,
  CreateUploadInput,
} from "../../../shared/types/upload";

export function useCreateUpload() {
  const [upload, setUpload] = useState<CreatedUpload | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearUpload = useCallback(() => {
    setUpload(null);
    setError(null);
  }, []);

  async function submitUpload(
    input: CreateUploadInput,
    userId: string,
    file: File,
  ): Promise<CreatedUpload | null> {
    setIsCreating(true);
    setError(null);
    setUpload(null);

    try {
      const createdUpload = await createUploadRecord(input, userId, file);
      setUpload(createdUpload);
      return createdUpload;
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to upload file",
      );
      return null;
    } finally {
      setIsCreating(false);
    }
  }

  return { upload, isCreating, error, submitUpload, clearUpload };
}

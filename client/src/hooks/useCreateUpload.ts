import type { CreateUploadInput } from "../../../shared/types/upload";
import { createUploadRecord } from "../api/uploads.api";
import { useCallback, useState } from "react";

export function useCreateUpload() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearUpload = useCallback(() => {
    setError(null);
  }, []);

  async function submitUpload(
    input: CreateUploadInput,
    userId: string,
    file: File,
  ): Promise<boolean> {
    setIsCreating(true);
    setError(null);

    try {
      await createUploadRecord(input, userId, file);
      return true;
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to upload file",
      );
      return false;
    } finally {
      setIsCreating(false);
    }
  }

  return { isCreating, error, submitUpload, clearUpload };
}

import { getDownloadUrl } from "../api/uploads.api";
import { useCallback, useState } from "react";

export function useDownloadUpload() {
  const [downloadingUploadId, setDownloadingUploadId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const clearDownload = useCallback(() => {
    setError(null);
  }, []);

  const downloadUpload = useCallback(
    async (uploadId: string, userId: string): Promise<void> => {
      setDownloadingUploadId(uploadId);
      setError(null);

      try {
        const { downloadUrl } = await getDownloadUrl(uploadId, userId);
        window.location.assign(downloadUrl);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to download image",
        );
      } finally {
        setDownloadingUploadId(null);
      }
    },
    [],
  );

  return { downloadingUploadId, error, downloadUpload, clearDownload };
}

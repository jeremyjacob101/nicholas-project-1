import { useCallback, useEffect, useState } from "react";
import { fetchUploads } from "../api/uploads.api";
import {
  initialUploadsState,
  type UploadsState,
} from "../../../shared/types/upload";

const UPLOAD_STATUS_POLL_INTERVAL_MS = 250;

function shouldPollUploads(uploads: UploadsState["uploads"]): boolean {
  return uploads.some(
    ({ status }) =>
      status === "uploaded" || status === "queued" || status === "processing",
  );
}

export function useUploads(userId: string) {
  const [state, setState] = useState<UploadsState>(initialUploadsState);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const refreshUploads = useCallback(() => {
    setRefreshVersion((currentVersion) => currentVersion + 1);
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let isActive = true;
    let pollTimeout: ReturnType<typeof setTimeout> | undefined;

    function loadUploads(): void {
      fetchUploads(userId)
        .then((uploads) => {
          if (!isActive) {
            return;
          }

          setState({ userId, refreshVersion, uploads, error: null });

          if (shouldPollUploads(uploads)) {
            pollTimeout = setTimeout(
              loadUploads,
              UPLOAD_STATUS_POLL_INTERVAL_MS,
            );
          }
        })
        .catch(() => {
          if (isActive) {
            setState({
              userId,
              refreshVersion,
              uploads: [],
              error: "Unable to load uploads",
            });
          }
        });
    }

    loadUploads();

    return () => {
      isActive = false;
      if (pollTimeout) {
        clearTimeout(pollTimeout);
      }
    };
  }, [refreshVersion, userId]);

  const hasCurrentResult =
    state.userId === userId && state.refreshVersion === refreshVersion;

  return {
    uploads: hasCurrentResult ? state.uploads : [],
    isLoading: Boolean(userId) && !hasCurrentResult,
    error: hasCurrentResult ? state.error : null,
    refreshUploads,
  };
}

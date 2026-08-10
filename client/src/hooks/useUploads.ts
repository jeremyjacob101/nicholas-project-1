import { useCallback, useEffect, useState } from "react";
import { fetchUploads } from "../api/uploads.api";
import {
  initialUploadsState,
  type UploadsState,
} from "../../../shared/types/upload";

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

    fetchUploads(userId)
      .then((uploads) => {
        if (isActive) {
          setState({ userId, refreshVersion, uploads, error: null });
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

    return () => {
      isActive = false;
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

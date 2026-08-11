import type { CreateUploadInput } from "../../../shared/types/upload";
import { UserSwitcher } from "../components/users/UserSwitcher";
import { useDownloadUpload } from "../hooks/useDownloadUpload";
import { UploadForm } from "../components/upload/UploadForm";
import { UploadList } from "../components/upload/UploadList";
import { useCreateUpload } from "../hooks/useCreateUpload";
import { useUploads } from "../hooks/useUploads";
import { useUsers } from "../hooks/useUsers";
import { Icon } from "../components/ui/Icon";
import { useState } from "react";

export default function ResearchUploadsPage() {
  const { users, isLoading: areUsersLoading, error: usersError } = useUsers();
  const [selectedUserId, setSelectedUserId] = useState("");
  const {
    isCreating,
    error: uploadError,
    submitUpload,
    clearUpload,
  } = useCreateUpload();
  const {
    downloadingUploadId,
    error: downloadError,
    downloadUpload,
    clearDownload,
  } = useDownloadUpload();
  const [formResetVersion, setFormResetVersion] = useState(0);

  const activeUserId = selectedUserId || users[0]?.id || "";
  const {
    uploads,
    isLoading: areUploadsLoading,
    error: uploadsError,
    refreshUploads,
  } = useUploads(activeUserId);

  async function handleUploadSubmit(values: CreateUploadInput, file: File) {
    if (!activeUserId) {
      return;
    }

    const didUpload = await submitUpload(values, activeUserId, file);

    if (!didUpload) {
      return;
    }

    setFormResetVersion((version) => version + 1);
    refreshUploads();
  }

  async function handleDownload(uploadId: string) {
    if (!activeUserId) {
      return;
    }

    await downloadUpload(uploadId, activeUserId);
    refreshUploads();
  }

  function handleUserChange(userId: string) {
    clearUpload();
    clearDownload();
    setSelectedUserId(userId);
    setFormResetVersion((version) => version + 1);
  }

  const activeUserIndex = users.findIndex((user) => user.id === activeUserId);
  const userTheme = activeUserIndex === 1 ? "theme-user-b" : "theme-user-a";

  return (
    <main className={`page ${userTheme}`}>
      <header className="page-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            <Icon name="crosshair" size={34} />
          </span>
          <h1>Secure Research Uploads</h1>
        </div>
        <div className="header-actions">
          <UserSwitcher
            users={users}
            selectedUserId={activeUserId}
            disabled={
              areUsersLoading || isCreating || downloadingUploadId !== null
            }
            onChange={handleUserChange}
          />
          <p className="workspace-context">Research workspace</p>
        </div>
      </header>

      <div className="workspace-grid">
        <section className="workspace-panel upload-panel">
          <div className="section-heading">
            <span className="section-rule" aria-hidden="true" />
            <h2>Upload image</h2>
          </div>

          {usersError ? (
            <p className="message error user-error" role="alert">
              <Icon name="alert" size={16} />
              <span>{usersError}</span>
            </p>
          ) : null}

          <UploadForm
            key={activeUserId + "-" + formResetVersion}
            disabled={!activeUserId || downloadingUploadId !== null}
            isSubmitting={isCreating}
            error={uploadError}
            onSubmit={handleUploadSubmit}
          />
        </section>

        <UploadList
          uploads={uploads}
          isLoading={areUploadsLoading}
          error={uploadsError}
          downloadError={downloadError}
          downloadingUploadId={downloadingUploadId}
          isDownloadDisabled={isCreating || downloadingUploadId !== null}
          onDownload={handleDownload}
        />
      </div>
    </main>
  );
}

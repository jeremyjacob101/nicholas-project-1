import { UploadRecordSummary } from "../components/upload/UploadRecordSummary";
import type { CreateUploadInput } from "../../../shared/types/upload";
import { UserSelector } from "../components/users/UserSelector";
import { UploadForm } from "../components/upload/UploadForm";
import { UploadList } from "../components/upload/UploadList";
import { useCreateUpload } from "../hooks/useCreateUpload";
import { useDownloadUpload } from "../hooks/useDownloadUpload";
import { useUploads } from "../hooks/useUploads";
import { useUsers } from "../hooks/useUsers";
import { useState } from "react";

export default function ResearchUploadsPage() {
  const { users, isLoading: areUsersLoading, error: usersError } = useUsers();
  const [selectedUserId, setSelectedUserId] = useState("");
  const {
    upload,
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

    const createdUpload = await submitUpload(values, activeUserId, file);

    if (createdUpload) {
      refreshUploads();
    }
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
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>Secure Research Uploads</h1>
      </header>

      <section className="panel">
        <UserSelector
          users={users}
          selectedUserId={activeUserId}
          isLoading={areUsersLoading}
          disabled={isCreating || downloadingUploadId !== null}
          error={usersError}
          onChange={handleUserChange}
        />

        <UploadForm
          disabled={!activeUserId || downloadingUploadId !== null}
          isSubmitting={isCreating}
          error={uploadError}
          onSubmit={handleUploadSubmit}
        />

        <UploadRecordSummary upload={upload} />
        <UploadList
          uploads={uploads}
          isLoading={areUploadsLoading}
          error={uploadsError}
          downloadError={downloadError}
          downloadingUploadId={downloadingUploadId}
          isDownloadDisabled={isCreating || downloadingUploadId !== null}
          onDownload={handleDownload}
        />
      </section>
    </main>
  );
}

import { UploadRecordSummary } from "../components/upload/UploadRecordSummary";
import type { CreateUploadInput } from "../../../shared/types/upload";
import { UserSelector } from "../components/users/UserSelector";
import { UploadForm } from "../components/upload/UploadForm";
import { UploadList } from "../components/upload/UploadList";
import { useCreateUpload } from "../hooks/useCreateUpload";
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

  function handleUserChange(userId: string) {
    clearUpload();
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
          disabled={isCreating}
          error={usersError}
          onChange={handleUserChange}
        />

        <UploadForm
          disabled={!activeUserId}
          isSubmitting={isCreating}
          error={uploadError}
          onSubmit={handleUploadSubmit}
        />

        <UploadRecordSummary upload={upload} />
        <UploadList
          uploads={uploads}
          isLoading={areUploadsLoading}
          error={uploadsError}
        />
      </section>
    </main>
  );
}

import { UploadRecordSummary } from "../components/upload/UploadRecordSummary";
import type { CreateUploadInput } from "../../../shared/types/upload";
import { UserSelector } from "../components/users/UserSelector";
import { UploadForm } from "../components/upload/UploadForm";
import { useCreateUpload } from "../hooks/useCreateUpload";
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
  } = useCreateUpload();

  const activeUserId = selectedUserId || users[0]?.id || "";

  function handleUploadSubmit(values: CreateUploadInput, file: File) {
    if (!activeUserId) {
      return;
    }

    void submitUpload(values, activeUserId, file);
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
          error={usersError}
          onChange={setSelectedUserId}
        />

        <UploadForm
          disabled={!activeUserId}
          isSubmitting={isCreating}
          error={uploadError}
          onSubmit={handleUploadSubmit}
        />

        <UploadRecordSummary upload={upload} />
      </section>
    </main>
  );
}

import type { UploadListProps } from "../../../../shared/props/upload";
import type { UploadStatus } from "../../../../shared/types/upload";
import type { IconName } from "../../../../shared/types/icon";
import { Icon } from "../ui/Icon";

function statusIconName(status: UploadStatus): IconName {
  switch (status) {
    case "completed":
      return "check";
    case "processing":
      return "spinner";
    case "failed":
      return "alert";
    case "uploaded":
    case "queued":
      return "clock";
  }
}

export function UploadList({
  uploads,
  isLoading,
  error,
  downloadError,
  downloadingUploadId,
  isDownloadDisabled,
  onDownload,
}: UploadListProps) {
  return (
    <section className="workspace-panel uploads" aria-live="polite">
      <div className="uploads-header">
        <div className="section-heading">
          <span className="section-rule" aria-hidden="true" />
          <h2>Your uploads</h2>
        </div>
        <span className="record-count">
          {uploads.length} {uploads.length === 1 ? "record" : "records"}
        </span>
      </div>
      {downloadError ? (
        <p className="message error" role="alert">
          <Icon name="alert" size={16} />
          <span>{downloadError}</span>
        </p>
      ) : null}
      {isLoading ? (
        <p className="loading-state">
          <Icon name="spinner" size={18} />
          <span>Loading uploads...</span>
        </p>
      ) : error ? (
        <p className="message error" role="alert">
          <Icon name="alert" size={16} />
          <span>{error}</span>
        </p>
      ) : uploads.length === 0 ? (
        <div className="empty-state">
          <Icon name="file" size={22} />
          <p>No uploads are available to this user.</p>
        </div>
      ) : (
        <>
          <div className="upload-list-heading" aria-hidden="true">
            <span>Filename</span>
            <span>Status</span>
            <span>Sample ID</span>
            <span>Classification</span>
            <span>Created</span>
            <span>Action</span>
          </div>
          <ul className="upload-list">
            {uploads.map((upload) => {
              const isDownloadable =
                upload.status !== "queued" && upload.status !== "failed";
              const isDownloading = downloadingUploadId === upload.id;

              return (
                <li className="upload-list-item" key={upload.id}>
                  <div className="upload-file-identity">
                    <Icon name="file" size={22} />
                    <strong>{upload.filename}</strong>
                  </div>
                  <span className={`upload-status status-${upload.status}`}>
                    <Icon name={statusIconName(upload.status)} size={16} />
                    {upload.status}
                  </span>
                  <dl className="upload-list-details">
                    <div>
                      <dt>Sample ID</dt>
                      <dd>{upload.sample_id}</dd>
                    </div>
                    <div>
                      <dt>Classification</dt>
                      <dd>{upload.classification}</dd>
                    </div>
                    <div>
                      <dt>Created</dt>
                      <dd>
                        <time dateTime={upload.created_at}>
                          {new Date(upload.created_at).toLocaleString()}
                        </time>
                      </dd>
                    </div>
                  </dl>
                  <button
                    aria-label={`Download ${upload.filename}`}
                    className="download-button"
                    disabled={!isDownloadable || isDownloadDisabled}
                    onClick={() => onDownload(upload.id)}
                    type="button"
                  >
                    <Icon name="download" size={16} />
                    <span>{isDownloading ? "Preparing..." : "Download"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

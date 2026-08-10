import type { UploadListProps } from "../../../../shared/props/upload";

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
    <section className="uploads" aria-live="polite">
      <h2>Your uploads</h2>
      {downloadError ? <p className="message error">{downloadError}</p> : null}
      {isLoading ? (
        <p>Loading uploads...</p>
      ) : error ? (
        <p className="message error">{error}</p>
      ) : uploads.length === 0 ? (
        <p>No uploads are available to this user.</p>
      ) : (
        <ul className="upload-list">
          {uploads.map((upload) => {
            const isDownloadable =
              upload.status !== "queued" && upload.status !== "failed";
            const isDownloading = downloadingUploadId === upload.id;

            return (
              <li className="upload-list-item" key={upload.id}>
                <div className="upload-list-header">
                  <strong>{upload.filename}</strong>
                  <div className="upload-list-actions">
                    <span className="upload-status">{upload.status}</span>
                    <button
                      aria-label={`Download ${upload.filename}`}
                      className="download-button"
                      disabled={!isDownloadable || isDownloadDisabled}
                      onClick={() => onDownload(upload.id)}
                      type="button"
                    >
                      {isDownloading ? "Preparing..." : "Download"}
                    </button>
                  </div>
                </div>
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
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

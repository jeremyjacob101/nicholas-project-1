import type { UploadListProps } from "../../../../shared/props/upload";

export function UploadList({ uploads, isLoading, error }: UploadListProps) {
  return (
    <section className="uploads" aria-live="polite">
      <h2>Your uploads</h2>
      {isLoading ? (
        <p>Loading uploads...</p>
      ) : error ? (
        <p className="message error">{error}</p>
      ) : uploads.length === 0 ? (
        <p>No uploads are available to this user.</p>
      ) : (
        <ul className="upload-list">
          {uploads.map((upload) => (
            <li className="upload-list-item" key={upload.id}>
              <div className="upload-list-header">
                <strong>{upload.filename}</strong>
                <span className="upload-status">{upload.status}</span>
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
          ))}
        </ul>
      )}
    </section>
  );
}

import type { UploadRecordSummaryProps } from "../../../../shared/props/upload";

export function UploadRecordSummary({ upload }: UploadRecordSummaryProps) {
  if (!upload) {
    return null;
  }

  return (
    <section className="result">
      <h2>
        {upload.status === "completed"
          ? "Image processing completed"
          : "Image uploaded"}
      </h2>
      <p>ID: {upload.id}</p>
      <p>Status: {upload.status}</p>
    </section>
  );
}

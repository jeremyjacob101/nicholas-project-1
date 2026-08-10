import type { UploadRecordSummaryProps } from "../../../../shared/props/upload";

export function UploadRecordSummary({ upload }: UploadRecordSummaryProps) {
  if (!upload) {
    return null;
  }

  const isConfirmed = upload.status === "uploaded";

  return (
    <section className="result">
      <h2>{isConfirmed ? "Image uploaded" : "Image stored"}</h2>
      <p>ID: {upload.id}</p>
      <p>Status: {upload.status}</p>
      {!isConfirmed ? <p>Awaiting backend confirmation.</p> : null}
    </section>
  );
}

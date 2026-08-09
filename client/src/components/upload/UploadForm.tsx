import type { UploadFormProps } from "../../../../shared/props/upload";
import type { SubmitEvent } from "react";
import { useState } from "react";

export function UploadForm({
  isSubmitting,
  error,
  disabled,
  onSubmit,
}: UploadFormProps) {
  const [sampleId, setSampleId] = useState("");
  const [classification, setClassification] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFileError(null);

    if (!file) {
      setFileError("Choose an image file");
      return;
    }

    onSubmit({
      sample_id: sampleId,
      filename: file.name,
      classification,
    });
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="sample-id">Sample ID</label>
        <input
          id="sample-id"
          value={sampleId}
          onChange={(event) => setSampleId(event.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="classification">Classification</label>
        <input
          id="classification"
          value={classification}
          onChange={(event) => setClassification(event.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="upload-file">File</label>
        <input
          id="upload-file"
          type="file"
          accept="image/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          required
        />
      </div>

      {(fileError || error) && (
        <p className="message error">{fileError ?? error}</p>
      )}

      <button type="submit" disabled={disabled || isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Upload Record"}
      </button>
    </form>
  );
}

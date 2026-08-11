import type { UploadFormProps } from "../../../../shared/props/upload";
import type { SubmitEvent } from "react";
import { Icon } from "../ui/Icon";
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

    onSubmit(
      {
        sample_id: sampleId,
        filename: file.name,
        classification,
      },
      file,
    );
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="field">
        <label className="field-label" htmlFor="sample-id">
          Sample ID
        </label>
        <input
          id="sample-id"
          value={sampleId}
          onChange={(event) => setSampleId(event.target.value)}
          required
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="classification">
          Classification
        </label>
        <input
          id="classification"
          value={classification}
          onChange={(event) => setClassification(event.target.value)}
          required
        />
      </div>

      <div className="field file-field">
        <span className="field-label" id="file-label">
          File
        </span>
        <div className="file-dropzone">
          <input
            id="upload-file"
            aria-labelledby="file-label"
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            required
          />
          <label className="file-dropzone-label" htmlFor="upload-file">
            <Icon name={file ? "check" : "upload"} size={30} />
            <strong>{file ? file.name : "Choose an image file"}</strong>
            <span>PNG, JPG, or WEBP up to 10 MB</span>
          </label>
        </div>
      </div>

      {(fileError || error) && (
        <p className="message error" role="alert">
          <Icon name="alert" size={16} />
          <span>{fileError ?? error}</span>
        </p>
      )}

      <button type="submit" disabled={disabled || isSubmitting}>
        <Icon name={isSubmitting ? "spinner" : "upload"} size={18} />
        <span>{isSubmitting ? "Uploading..." : "Upload Image"}</span>
      </button>
    </form>
  );
}

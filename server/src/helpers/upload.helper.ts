import type {
  CreateUploadInput,
  InitiateUploadInput,
} from "../../../shared/types/upload.ts";

export const PROCESSING_TIMEOUT_MS = 5_000;
export const PROCESSING_START_DELAY_MS = 250;
export const SIMULATED_QUEUE_DURATION_MS = 500;
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
export const SIMULATED_PROCESSING_DURATION_MS = 3_000;

export const activeProcessingUploadIds = new Set<string>();

const IMAGE_MIME_TYPE_PATTERN = /^image\/[a-z0-9][a-z0-9.+-]*$/;
const UPLOAD_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isImageContentType(contentType: string): boolean {
  return IMAGE_MIME_TYPE_PATTERN.test(contentType.trim().toLowerCase());
}

export function isValidUploadId(uploadId: unknown): uploadId is string {
  return typeof uploadId === "string" && UPLOAD_ID_PATTERN.test(uploadId);
}

export function getSafeFilename(filename: string): string {
  const filenameWithoutPath = filename.replaceAll("\\", "/").split("/").pop();
  const safeFilename = (filenameWithoutPath ?? "")
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 200);

  return safeFilename || "unnamed-file";
}

function getValidatedCreateUploadInput(
  body: unknown,
): CreateUploadInput | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const input = body as Partial<CreateUploadInput>;

  if (
    typeof input.sample_id !== "string" ||
    typeof input.filename !== "string" ||
    typeof input.classification !== "string"
  ) {
    return null;
  }

  const sampleId = input.sample_id.trim();
  const filename = input.filename.trim();
  const classification = input.classification.trim();

  if (!sampleId || !filename || !classification) {
    return null;
  }

  return {
    sample_id: sampleId,
    filename,
    classification,
  };
}

export function validateInitiateUploadInput(
  body: unknown,
): { input: InitiateUploadInput } | { error: string } {
  const uploadInput = getValidatedCreateUploadInput(body);

  if (!uploadInput) {
    return {
      error: "sample_id, filename, and classification are required",
    };
  }

  const input = body as Partial<InitiateUploadInput>;
  const contentType =
    typeof input.content_type === "string"
      ? input.content_type.trim().toLowerCase()
      : "";

  if (!isImageContentType(contentType)) {
    return { error: "Only image files are supported" };
  }

  const contentLength = input.content_length;

  if (
    typeof contentLength !== "number" ||
    !Number.isSafeInteger(contentLength) ||
    contentLength < 1 ||
    contentLength > MAX_IMAGE_SIZE_BYTES
  ) {
    return { error: "Image must be between 1 byte and 10 MB" };
  }

  return {
    input: {
      ...uploadInput,
      content_type: contentType,
      content_length: contentLength,
    },
  };
}

import type { Request, Response } from "express";
import type {
  CreateUploadInput,
  ValidatedUploadRequest,
} from "../../../shared/types/upload.ts";

export function getSafeFilename(filename: string): string {
  const filenameWithoutPath = filename.replaceAll("\\", "/").split("/").pop();
  const safeFilename = (filenameWithoutPath ?? "")
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 200);

  return safeFilename || "unnamed-file";
}

function getValidatedInput(body: unknown): CreateUploadInput | null {
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

export function getValidatedUploadRequest(
  request: Request,
  response: Response,
): ValidatedUploadRequest | null {
  const input = getValidatedInput(request.body);

  if (!input) {
    response.status(400).json({
      error: "sample_id, filename, and classification are required",
    });
    return null;
  }

  const file = request.file;

  if (!file) {
    response.status(400).json({ error: "An image file is required" });
    return null;
  }

  if (!file.mimetype.toLowerCase().startsWith("image/")) {
    response.status(400).json({ error: "Only image files are supported" });
    return null;
  }

  const devUserId = request.header("X-Dev-User-Id");

  if (!devUserId) {
    response.status(401).json({ error: "A current user is required" });
    return null;
  }

  return { input, file, devUserId };
}

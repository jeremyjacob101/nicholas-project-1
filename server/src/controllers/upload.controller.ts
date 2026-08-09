import { createUpload } from "../models/upload.model.js";
import { findUserById } from "../models/user.model.js";
import type { Request, Response } from "express";
import type {
  CreatedUpload,
  CreateUploadInput,
} from "../../../shared/types/upload.js";
import { randomUUID } from "node:crypto";

function getSafeFilename(filename: string): string {
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

export async function createUploadRecord(
  request: Request,
  response: Response,
): Promise<void> {
  const input = getValidatedInput(request.body);

  if (!input) {
    response.status(400).json({
      error: "sample_id, filename, and classification are required",
    });
    return;
  }

  const devUserId = request.header("X-Dev-User-Id");

  if (!devUserId) {
    response.status(401).json({ error: "A current user is required" });
    return;
  }

  try {
    const user = await findUserById(devUserId);

    if (!user) {
      response.status(401).json({ error: "Invalid current user" });
      return;
    }

    const uploadId = randomUUID();
    const safeFilename = getSafeFilename(input.filename);
    const objectKey = `uploads/${user.company_id}/${uploadId}/${safeFilename}`;

    const upload = await createUpload({
      ...input,
      id: uploadId,
      safe_filename: safeFilename,
      company_id: user.company_id,
      created_by_user_id: user.id,
      object_key: objectKey,
    });

    const createdUpload: CreatedUpload = {
      id: upload.id,
      status: upload.status,
    };

    response.status(201).json(createdUpload);
  } catch (error) {
    console.error("Failed to create upload record:", error);
    response.status(500).json({ error: "Unable to create upload" });
  }
}

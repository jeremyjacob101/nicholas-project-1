import type {
  CreatedUpload,
  CreateUploadInput,
  InitiatedUpload,
} from "../../../shared/types/upload";
import { apiFetch } from "./client";

async function uploadImageToMinio(
  uploadUrl: string,
  file: File,
): Promise<void> {
  try {
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error("Unable to upload image to storage");
    }
  } catch {
    throw new Error("Unable to upload image to storage");
  }
}

async function confirmUpload(
  uploadId: string,
  userId: string,
): Promise<CreatedUpload> {
  return apiFetch<CreatedUpload>(
    `/api/uploads/${encodeURIComponent(uploadId)}/confirm`,
    {
      method: "POST",
      headers: {
        "X-Dev-User-Id": userId,
      },
    },
  );
}

export async function createUploadRecord(
  input: CreateUploadInput,
  userId: string,
  file: File,
): Promise<CreatedUpload> {
  const initiatedUpload = await apiFetch<InitiatedUpload>("/api/uploads/init", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Dev-User-Id": userId,
    },
    body: JSON.stringify({
      ...input,
      content_type: file.type,
      content_length: file.size,
    }),
  });

  await uploadImageToMinio(initiatedUpload.uploadUrl, file);

  return confirmUpload(initiatedUpload.upload.id, userId);
}

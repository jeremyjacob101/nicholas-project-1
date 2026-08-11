import type {
  AuthorizedUpload,
  CreateUploadInput,
  InitiatedUpload,
  PresignedDownload,
} from "../../../shared/types/upload";
import { apiFetch } from "./client";

export async function fetchUploads(
  userId: string,
): Promise<AuthorizedUpload[]> {
  const data = await apiFetch<{ uploads: AuthorizedUpload[] }>("/api/uploads", {
    headers: { "X-Dev-User-Id": userId },
  });

  return data.uploads;
}

export async function getDownloadUrl(
  uploadId: string,
  userId: string,
): Promise<PresignedDownload> {
  return apiFetch<PresignedDownload>(
    `/api/uploads/${encodeURIComponent(uploadId)}/download`,
    {
      headers: { "X-Dev-User-Id": userId },
    },
  );
}

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

async function confirmUpload(uploadId: string, userId: string): Promise<void> {
  await apiFetch<void>(`/api/uploads/${encodeURIComponent(uploadId)}/confirm`, {
    method: "POST",
    headers: {
      "X-Dev-User-Id": userId,
    },
  });
}

export async function createUploadRecord(
  input: CreateUploadInput,
  userId: string,
  file: File,
): Promise<void> {
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

  await confirmUpload(initiatedUpload.upload.id, userId);
}

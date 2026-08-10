import type {
  CreatedUpload,
  CreateUploadInput,
} from "../../../shared/types/upload";
import { apiFetch } from "./client";

export async function createUploadRecord(
  input: CreateUploadInput,
  userId: string,
  file: File,
): Promise<CreatedUpload> {
  const formData = new FormData();

  for (const [name, value] of Object.entries(input)) {
    formData.append(name, value);
  }

  formData.append("file", file, file.name);

  return apiFetch<CreatedUpload>("/api/uploads", {
    method: "POST",
    headers: {
      "X-Dev-User-Id": userId,
    },
    body: formData,
  });
}

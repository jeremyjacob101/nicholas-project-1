import type {
  CreatedUpload,
  CreateUploadInput,
} from "../../../shared/types/upload";
import { apiFetch } from "./client";

export async function createUploadRecord(
  input: CreateUploadInput,
  userId: string,
): Promise<CreatedUpload> {
  return apiFetch<CreatedUpload>("/api/uploads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Dev-User-Id": userId,
    },
    body: JSON.stringify(input),
  });
}

import { activeProcessingUploadIds } from "../helpers/upload.helper.ts";
import { deleteMinioObject, getMinioObjectStat } from "../minio.ts";
import { processConfirmedUpload } from "./processing.service.ts";
import type { BucketItemStat } from "minio";
import type {
  ConfirmUploadResult,
  StoredImageValidationResult,
  UploadConfirmationState,
  UploadStatus,
} from "../../../shared/types/upload.ts";
import {
  describeMinioError,
  isMinioObjectNotFound,
} from "../helpers/storage.helper.ts";
import {
  MAX_IMAGE_SIZE_BYTES,
  isImageContentType,
} from "../helpers/upload.helper.ts";
import {
  findUploadRecordByIdAndCompanyId,
  updateUploadStatus,
} from "../models/upload.model.ts";

function getUploadConfirmationState(
  status: UploadStatus,
): UploadConfirmationState {
  if (status === "completed") {
    return "completed";
  }

  return status === "queued" ? "queued" : "unavailable";
}

function validateStoredImage(
  objectStat: BucketItemStat,
): StoredImageValidationResult {
  const contentType = objectStat.metaData["content-type"];
  const hasValidSize =
    Number.isSafeInteger(objectStat.size) &&
    objectStat.size >= 1 &&
    objectStat.size <= MAX_IMAGE_SIZE_BYTES;
  const hasValidContentType =
    typeof contentType === "string" && isImageContentType(contentType);

  if (!hasValidSize) {
    return {
      valid: false,
      error: "Image must be between 1 byte and 10 MB",
    };
  }

  if (!hasValidContentType) {
    return {
      valid: false,
      error: "Only image files are supported",
    };
  }

  return { valid: true };
}

export async function confirmUploadForCompany(
  uploadId: string,
  companyId: string,
): Promise<ConfirmUploadResult> {
  const upload = await findUploadRecordByIdAndCompanyId(uploadId, companyId);

  if (!upload) {
    return { kind: "not-found" };
  }

  const confirmationState = getUploadConfirmationState(upload.status);

  if (confirmationState === "completed") {
    return { kind: "completed", id: upload.id, status: "completed" };
  }

  if (confirmationState === "unavailable") {
    return { kind: "unavailable" };
  }

  let objectStat: BucketItemStat;

  try {
    objectStat = await getMinioObjectStat(upload.object_key);
  } catch (error) {
    if (isMinioObjectNotFound(error)) {
      await updateUploadStatus(upload.id, "failed");
      return { kind: "missing-object" };
    }

    console.error(
      "Failed to inspect uploaded MinIO object:",
      describeMinioError(error),
    );
    await updateUploadStatus(upload.id, "failed");
    return { kind: "storage-error" };
  }

  const validation = validateStoredImage(objectStat);

  if (!validation.valid) {
    try {
      await deleteMinioObject(upload.object_key);
    } catch (error) {
      console.error(
        "Failed to remove invalid MinIO object:",
        describeMinioError(error),
      );
    }

    await updateUploadStatus(upload.id, "failed");
    return { kind: "invalid-image", error: validation.error };
  }

  if (activeProcessingUploadIds.has(upload.id)) {
    return { kind: "already-processing" };
  }

  activeProcessingUploadIds.add(upload.id);

  try {
    await processConfirmedUpload(upload.id, companyId, upload.object_key);
    return { kind: "completed", id: upload.id, status: "completed" };
  } catch (error) {
    console.error("Failed to process confirmed upload:", error);
    return { kind: "processing-error" };
  } finally {
    activeProcessingUploadIds.delete(upload.id);
  }
}

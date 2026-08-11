import type { UploadStatus } from "../../../shared/types/upload.ts";
import { transitionUploadStatus } from "../models/upload.model.ts";
import { getMinioObjectStat } from "../minio.ts";
import {
  PROCESSING_TIMEOUT_MS,
  SIMULATED_QUEUE_DURATION_MS,
  SIMULATED_PROCESSING_DURATION_MS,
} from "../helpers/upload.helper.ts";

async function wait(durationMs: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

async function runWithTimeout(
  operation: Promise<void>,
  timeoutMs: number,
): Promise<void> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => {
          reject(new Error("Image processing timed out"));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

async function transitionProcessingStatus(
  uploadId: string,
  companyId: string,
  currentStatus: UploadStatus,
  nextStatus: UploadStatus,
): Promise<void> {
  const statusUpdated = await transitionUploadStatus(
    uploadId,
    companyId,
    currentStatus,
    nextStatus,
  );

  if (!statusUpdated) {
    throw new Error(
      `Upload status could not transition from ${currentStatus} to ${nextStatus}`,
    );
  }
}

export async function processConfirmedUpload(
  uploadId: string,
  companyId: string,
  objectKey: string,
): Promise<void> {
  let currentStatus: UploadStatus = "uploaded";

  async function runProcessingStages(): Promise<void> {
    await transitionProcessingStatus(
      uploadId,
      companyId,
      currentStatus,
      "queued",
    );
    currentStatus = "queued";

    await wait(SIMULATED_QUEUE_DURATION_MS);

    await transitionProcessingStatus(
      uploadId,
      companyId,
      currentStatus,
      "processing",
    );
    currentStatus = "processing";

    await wait(SIMULATED_PROCESSING_DURATION_MS);
    await getMinioObjectStat(objectKey);

    await transitionProcessingStatus(
      uploadId,
      companyId,
      currentStatus,
      "completed",
    );
    currentStatus = "completed";
  }

  try {
    await runWithTimeout(runProcessingStages(), PROCESSING_TIMEOUT_MS);
  } catch (error) {
    try {
      await transitionProcessingStatus(
        uploadId,
        companyId,
        currentStatus,
        "failed",
      );
    } catch (statusError) {
      console.error("Failed to mark processing as failed:", statusError);
    }

    throw error;
  }
}

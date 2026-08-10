import type { CurrentUserLocals } from "../../../shared/types/user.ts";
import type { Request, Response } from "express";
import type { BucketItemStat } from "minio";
import { randomUUID } from "node:crypto";
import type {
  InitiatedUpload,
  PresignedDownload,
} from "../../../shared/types/upload.ts";
import {
  describeMinioError,
  getPresignedUrlExpiresAt,
  isMinioObjectNotFound,
} from "../helpers/storage.helper.ts";
import {
  getSafeFilename,
  isImageContentType,
  isValidUploadId,
  MAX_IMAGE_SIZE_BYTES,
  validateInitiateUploadInput,
} from "../helpers/upload.helper.ts";
import {
  createUpload,
  findUploadByIdAndCompanyId,
  findUploadsByCompanyId,
  findUploadRecordByIdAndCompanyId,
  updateUploadStatus,
} from "../models/upload.model.ts";
import {
  createPresignedMinioDownloadUrl,
  createPresignedMinioUploadUrl,
  deleteMinioObject,
  getMinioObjectStat,
} from "../minio.ts";

type CurrentUserResponse = Response<unknown, CurrentUserLocals>;

export async function initiateUpload(
  request: Request,
  response: CurrentUserResponse,
): Promise<void> {
  const validation = validateInitiateUploadInput(request.body);

  if ("error" in validation) {
    response.status(400).json({ error: validation.error });
    return;
  }

  const { input } = validation;
  const user = response.locals.currentUser;

  let uploadId: string | undefined;

  try {
    uploadId = randomUUID();
    const safeFilename = getSafeFilename(input.filename);
    const objectKey = `uploads/${user.company_id}/${uploadId}/${safeFilename}`;

    const upload = await createUpload({
      sample_id: input.sample_id,
      filename: input.filename,
      classification: input.classification,
      id: uploadId,
      safe_filename: safeFilename,
      company_id: user.company_id,
      created_by_user_id: user.id,
      object_key: objectKey,
    });
    const uploadUrl = await createPresignedMinioUploadUrl(objectKey);

    const initiatedUpload: InitiatedUpload = {
      upload: {
        id: upload.id,
        status: upload.status,
      },
      uploadUrl,
      expiresAt: getPresignedUrlExpiresAt(),
    };

    response.status(201).json(initiatedUpload);
  } catch (error) {
    if (uploadId) {
      try {
        await updateUploadStatus(uploadId, "failed");
      } catch (statusError) {
        console.error("Failed to mark upload as failed:", statusError);
      }
    }

    console.error("Failed to initialize upload:", error);
    response.status(500).json({ error: "Unable to initialize upload" });
  }
}

export async function confirmUpload(
  request: Request,
  response: CurrentUserResponse,
): Promise<void> {
  const uploadId = request.params.uploadId;
  const user = response.locals.currentUser;

  if (!isValidUploadId(uploadId)) {
    response.status(404).json({ error: "Upload not found" });
    return;
  }

  try {
    const upload = await findUploadRecordByIdAndCompanyId(
      uploadId,
      user.company_id,
    );

    if (!upload) {
      response.status(404).json({ error: "Upload not found" });
      return;
    }

    if (upload.status === "uploaded") {
      response.json({ id: upload.id, status: upload.status });
      return;
    }

    if (upload.status !== "queued") {
      response.status(409).json({ error: "Upload cannot be confirmed" });
      return;
    }

    let objectStat: BucketItemStat;

    try {
      objectStat = await getMinioObjectStat(upload.object_key);
    } catch (error) {
      if (isMinioObjectNotFound(error)) {
        await updateUploadStatus(upload.id, "failed");
        response.status(400).json({ error: "Uploaded image was not found" });
        return;
      }

      console.error(
        "Failed to inspect uploaded MinIO object:",
        describeMinioError(error),
      );
      response.status(500).json({ error: "Unable to confirm upload" });
      return;
    }

    const contentType = objectStat.metaData["content-type"];
    const hasValidSize =
      Number.isSafeInteger(objectStat.size) &&
      objectStat.size >= 1 &&
      objectStat.size <= MAX_IMAGE_SIZE_BYTES;
    const hasValidContentType =
      typeof contentType === "string" && isImageContentType(contentType);

    if (!hasValidSize || !hasValidContentType) {
      try {
        await deleteMinioObject(upload.object_key);
      } catch (error) {
        console.error(
          "Failed to remove invalid MinIO object:",
          describeMinioError(error),
        );
      }

      await updateUploadStatus(upload.id, "failed");
      response.status(400).json({
        error: hasValidSize
          ? "Only image files are supported"
          : "Image must be between 1 byte and 10 MB",
      });
      return;
    }

    await updateUploadStatus(upload.id, "uploaded");
    response.json({ id: upload.id, status: "uploaded" });
  } catch (error) {
    console.error("Failed to confirm upload:", error);
    response.status(500).json({ error: "Unable to confirm upload" });
  }
}

export async function listUploads(
  request: Request,
  response: CurrentUserResponse,
): Promise<void> {
  const user = response.locals.currentUser;

  try {
    const uploads = await findUploadsByCompanyId(user.company_id);
    response.json({ uploads });
  } catch (error) {
    console.error("Failed to list uploads:", error);
    response.status(500).json({ error: "Unable to load uploads" });
  }
}

export async function getUploadDownloadUrl(
  request: Request,
  response: CurrentUserResponse,
): Promise<void> {
  const uploadId = request.params.uploadId;
  const user = response.locals.currentUser;

  if (!isValidUploadId(uploadId)) {
    response.status(404).json({ error: "Upload not found" });
    return;
  }

  try {
    const upload = await findUploadRecordByIdAndCompanyId(
      uploadId,
      user.company_id,
    );

    if (!upload) {
      response.status(404).json({ error: "Upload not found" });
      return;
    }

    if (upload.status === "queued" || upload.status === "failed") {
      response
        .status(409)
        .json({ error: "Upload is not available for download" });
      return;
    }

    try {
      await getMinioObjectStat(upload.object_key);
    } catch (error) {
      if (isMinioObjectNotFound(error)) {
        await updateUploadStatus(upload.id, "failed");
        response
          .status(409)
          .json({ error: "Upload is not available for download" });
        return;
      }

      console.error(
        "Failed to inspect downloaded MinIO object:",
        describeMinioError(error),
      );
      response.status(500).json({ error: "Unable to prepare download" });
      return;
    }

    const downloadUrl = await createPresignedMinioDownloadUrl(
      upload.object_key,
      upload.safe_filename,
    );
    const presignedDownload: PresignedDownload = {
      downloadUrl,
      expiresAt: getPresignedUrlExpiresAt(),
    };

    response.json(presignedDownload);
  } catch (error) {
    console.error("Failed to prepare download:", error);
    response.status(500).json({ error: "Unable to prepare download" });
  }
}

export async function getUpload(
  request: Request,
  response: CurrentUserResponse,
): Promise<void> {
  const uploadId = request.params.uploadId;
  const user = response.locals.currentUser;

  if (!isValidUploadId(uploadId)) {
    response.status(404).json({ error: "Upload not found" });
    return;
  }

  try {
    const upload = await findUploadByIdAndCompanyId(uploadId, user.company_id);

    if (!upload) {
      response.status(404).json({ error: "Upload not found" });
      return;
    }

    response.json({ upload });
  } catch (error) {
    console.error("Failed to load upload:", error);
    response.status(500).json({ error: "Unable to load upload" });
  }
}

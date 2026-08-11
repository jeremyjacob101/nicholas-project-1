import { confirmUploadForCompany } from "../services/upload-confirmation.service.ts";
import { randomUUID } from "node:crypto";
import type {
  CurrentUserResponse,
  InitiatedUpload,
  PresignedDownload,
} from "../../../shared/types/upload.ts";
import type { Request } from "express";
import {
  describeMinioError,
  isMinioObjectNotFound,
} from "../helpers/storage.helper.ts";
import {
  getSafeFilename,
  isValidUploadId,
  validateInitiateUploadInput,
} from "../helpers/upload.helper.ts";
import {
  createUpload,
  findUploadsByCompanyId,
  findUploadRecordByIdAndCompanyId,
  updateUploadStatus,
} from "../models/upload.model.ts";
import {
  createPresignedMinioDownloadUrl,
  createPresignedMinioUploadUrl,
  getMinioObjectStat,
} from "../minio.ts";

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
      },
      uploadUrl,
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

  if (!isValidUploadId(uploadId)) {
    response.status(404).json({ error: "Upload not found" });
    return;
  }

  try {
    const result = await confirmUploadForCompany(
      uploadId,
      response.locals.currentUser.company_id,
    );

    switch (result.kind) {
      case "not-found":
        response.status(404).json({ error: "Upload not found" });
        return;
      case "uploaded":
      case "completed":
        response.status(204).send();
        return;
      case "unavailable":
        response.status(409).json({ error: "Upload cannot be confirmed" });
        return;
      case "missing-object":
        response.status(400).json({ error: "Uploaded image was not found" });
        return;
      case "storage-error":
        response.status(500).json({ error: "Unable to confirm upload" });
        return;
      case "invalid-image":
        response.status(400).json({ error: result.error });
        return;
      case "already-processing":
        response.status(409).json({ error: "Upload is already processing" });
        return;
    }
  } catch (error) {
    console.error("Failed to confirm upload:", error);
    response.status(500).json({ error: "Unable to confirm upload" });
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
    };

    response.json(presignedDownload);
  } catch (error) {
    console.error("Failed to prepare download:", error);
    response.status(500).json({ error: "Unable to prepare download" });
  }
}

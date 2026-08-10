import { createUpload, updateUploadStatus } from "../models/upload.model.ts";
import type { CreatedUpload } from "../../../shared/types/upload.ts";
import { deleteMinioObject, uploadMinioObject } from "../minio.ts";
import { findUserById } from "../models/user.model.ts";
import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import {
  getSafeFilename,
  getValidatedUploadRequest,
} from "../helpers/upload.helper.ts";

export async function createUploadRecord(
  request: Request,
  response: Response,
): Promise<void> {
  const validatedRequest = getValidatedUploadRequest(request, response);

  if (!validatedRequest) {
    return;
  }

  const { input, file, devUserId } = validatedRequest;

  let objectKey: string | undefined;
  let uploadId: string | undefined;
  let objectWasUploaded = false;

  try {
    const user = await findUserById(devUserId);

    if (!user) {
      response.status(401).json({ error: "Invalid current user" });
      return;
    }

    uploadId = randomUUID();
    const filename = file.originalname || input.filename;
    const safeFilename = getSafeFilename(filename);
    objectKey = `uploads/${user.company_id}/${uploadId}/${safeFilename}`;

    const upload = await createUpload({
      ...input,
      filename,
      id: uploadId,
      safe_filename: safeFilename,
      company_id: user.company_id,
      created_by_user_id: user.id,
      object_key: objectKey,
    });

    await uploadMinioObject(objectKey, file.buffer, file.mimetype);
    objectWasUploaded = true;
    await updateUploadStatus(upload.id, "uploaded");

    const createdUpload: CreatedUpload = {
      id: upload.id,
      status: "uploaded",
    };

    response.status(201).json(createdUpload);
  } catch (error) {
    if (objectWasUploaded && objectKey) {
      try {
        await deleteMinioObject(objectKey);
      } catch (cleanupError) {
        console.error("Failed to clean up uploaded object:", cleanupError);
      }
    }

    if (uploadId) {
      try {
        await updateUploadStatus(uploadId, "failed");
      } catch (statusError) {
        console.error("Failed to mark upload as failed:", statusError);
      }
    }

    console.error("Failed to upload file:", error);
    response.status(500).json({ error: "Unable to upload file" });
  }
}

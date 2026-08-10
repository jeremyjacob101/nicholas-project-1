import {
  confirmUpload,
  getUpload,
  getUploadDownloadUrl,
  initiateUpload,
  listUploads,
} from "../controllers/upload.controller.ts";
import { requireCurrentUser } from "../middleware/require-current-user.middleware.ts";
import { Router } from "express";

const uploadRouter = Router();

uploadRouter.use(requireCurrentUser);

uploadRouter.get("/", listUploads);
uploadRouter.post("/init", initiateUpload);
uploadRouter.get("/:uploadId", getUpload);
uploadRouter.post("/:uploadId/confirm", confirmUpload);
uploadRouter.get("/:uploadId/download", getUploadDownloadUrl);

export default uploadRouter;

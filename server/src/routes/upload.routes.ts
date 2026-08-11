import { requireCurrentUser } from "../middleware/require-current-user.middleware.ts";
import {
  confirmUpload,
  getUploadDownloadUrl,
  initiateUpload,
  listUploads,
} from "../controllers/upload.controller.ts";
import { Router } from "express";

const uploadRouter = Router();

uploadRouter.use(requireCurrentUser);

uploadRouter.get("/", listUploads);
uploadRouter.post("/init", initiateUpload);
uploadRouter.post("/:uploadId/confirm", confirmUpload);
uploadRouter.get("/:uploadId/download", getUploadDownloadUrl);

export default uploadRouter;

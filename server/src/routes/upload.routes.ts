import {
  confirmUpload,
  getUpload,
  initiateUpload,
  listUploads,
} from "../controllers/upload.controller.ts";
import { Router } from "express";

const uploadRouter = Router();

uploadRouter.get("/", listUploads);
uploadRouter.get("/:uploadId", getUpload);
uploadRouter.post("/init", initiateUpload);
uploadRouter.post("/:uploadId/confirm", confirmUpload);

export default uploadRouter;

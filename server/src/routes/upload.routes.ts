import {
  confirmUpload,
  initiateUpload,
} from "../controllers/upload.controller.ts";
import { Router } from "express";

const uploadRouter = Router();

uploadRouter.post("/init", initiateUpload);
uploadRouter.post("/:uploadId/confirm", confirmUpload);

export default uploadRouter;

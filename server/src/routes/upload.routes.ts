import { createUploadRecord } from "../controllers/upload.controller.ts";
import { parseImageUpload } from "../middleware/upload.middleware.ts";
import { Router } from "express";

const uploadRouter = Router();

uploadRouter.post("/", parseImageUpload, createUploadRecord);

export default uploadRouter;

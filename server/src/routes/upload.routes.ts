import { createUploadRecord } from "../controllers/upload.controller.js";
import { parseImageUpload } from "../middleware/upload.middleware.js";
import { Router } from "express";

const uploadRouter = Router();

uploadRouter.post("/", parseImageUpload, createUploadRecord);

export default uploadRouter;

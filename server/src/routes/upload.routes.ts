import { createUploadRecord } from "../controllers/upload.controller.js";
import { Router } from "express";

const uploadRouter = Router();

uploadRouter.post("/", createUploadRecord);

export default uploadRouter;

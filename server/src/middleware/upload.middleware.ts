import type { NextFunction, Request, Response } from "express";
import multer from "multer";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const multipartUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
    files: 1,
    fields: 3,
  },
});

export function parseImageUpload(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  multipartUpload.single("file")(request, response, (error) => {
    if (!error) {
      next();
      return;
    }

    const message =
      error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
        ? "Image must be 10 MB or smaller"
        : "Invalid upload form";

    response.status(400).json({ error: message });
  });
}

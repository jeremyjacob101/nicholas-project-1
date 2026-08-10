import {
  getSafeFilename,
  isValidUploadId,
  MAX_IMAGE_SIZE_BYTES,
  validateInitiateUploadInput,
} from "../../server/src/helpers/upload.helper.ts";
import { describe, expect, test } from "vitest";

function getValidInput(overrides: Record<string, unknown> = {}): unknown {
  return {
    sample_id: " SAMPLE-123 ",
    filename: " scan.png ",
    classification: " Research ",
    content_type: " image/png ",
    content_length: 1,
    ...overrides,
  };
}

describe("safe upload filenames", () => {
  test("removes client path segments", () => {
    expect(getSafeFilename("../../scans/scan.png")).toBe("scan.png");
    expect(getSafeFilename("C:\\scans\\scan.png")).toBe("scan.png");
  });

  test("normalizes and replaces unsafe characters", () => {
    expect(getSafeFilename("Ｆｉｌｅ name (final).png")).toBe(
      "File_name__final_.png",
    );
  });

  test("removes dangerous leading dots and supplies a fallback", () => {
    expect(getSafeFilename("...hidden.png")).toBe("hidden.png");
    expect(getSafeFilename("...")).toBe("unnamed-file");
  });

  test("caps filenames at 200 characters", () => {
    expect(getSafeFilename("a".repeat(250))).toHaveLength(200);
  });
});

describe("upload ID validation", () => {
  test("accepts a valid UUID upload ID", () => {
    expect(isValidUploadId("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")).toBe(true);
  });

  test.each([
    undefined,
    null,
    42,
    "not-an-upload-id",
    "aaaaaaaa-aaaa-6aaa-8aaa-aaaaaaaaaaaa",
    "aaaaaaaa-aaaa-4aaa-caaa-aaaaaaaaaaaa",
  ])("rejects an invalid upload ID: %s", (uploadId) => {
    expect(isValidUploadId(uploadId)).toBe(false);
  });
});

describe("upload initialization validation", () => {
  test("trims accepted metadata and normalizes the MIME type", () => {
    const result = validateInitiateUploadInput(getValidInput());

    expect("error" in result).toBe(false);

    if ("error" in result) {
      throw new Error(result.error);
    }

    expect(result.input).toEqual({
      sample_id: "SAMPLE-123",
      filename: "scan.png",
      classification: "Research",
      content_type: "image/png",
      content_length: 1,
    });
  });

  test.each([
    [
      "a non-object body",
      null,
      "sample_id, filename, and classification are required",
    ],
    [
      "a missing sample ID",
      getValidInput({ sample_id: undefined }),
      "sample_id, filename, and classification are required",
    ],
    [
      "a blank sample ID",
      getValidInput({ sample_id: "  " }),
      "sample_id, filename, and classification are required",
    ],
    [
      "a non-string sample ID",
      getValidInput({ sample_id: 42 }),
      "sample_id, filename, and classification are required",
    ],
    [
      "a missing filename",
      getValidInput({ filename: undefined }),
      "sample_id, filename, and classification are required",
    ],
    [
      "a blank filename",
      getValidInput({ filename: "  " }),
      "sample_id, filename, and classification are required",
    ],
    [
      "a non-string filename",
      getValidInput({ filename: [] }),
      "sample_id, filename, and classification are required",
    ],
    [
      "a missing classification",
      getValidInput({ classification: undefined }),
      "sample_id, filename, and classification are required",
    ],
    [
      "a blank classification",
      getValidInput({ classification: "  " }),
      "sample_id, filename, and classification are required",
    ],
    [
      "a non-string classification",
      getValidInput({ classification: {} }),
      "sample_id, filename, and classification are required",
    ],
    [
      "a missing content type",
      getValidInput({ content_type: undefined }),
      "Only image files are supported",
    ],
    [
      "a non-string content type",
      getValidInput({ content_type: true }),
      "Only image files are supported",
    ],
    [
      "a non-image content type",
      getValidInput({ content_type: "text/plain" }),
      "Only image files are supported",
    ],
    [
      "an incomplete image content type",
      getValidInput({ content_type: "image/" }),
      "Only image files are supported",
    ],
    [
      "a missing content length",
      getValidInput({ content_length: undefined }),
      "Image must be between 1 byte and 10 MB",
    ],
    [
      "a non-number content length",
      getValidInput({ content_length: "1" }),
      "Image must be between 1 byte and 10 MB",
    ],
    [
      "a zero-byte content length",
      getValidInput({ content_length: 0 }),
      "Image must be between 1 byte and 10 MB",
    ],
    [
      "a fractional content length",
      getValidInput({ content_length: 1.5 }),
      "Image must be between 1 byte and 10 MB",
    ],
    [
      "an oversized content length",
      getValidInput({ content_length: MAX_IMAGE_SIZE_BYTES + 1 }),
      "Image must be between 1 byte and 10 MB",
    ],
  ])("rejects %s", (_description, input, error) => {
    const result = validateInitiateUploadInput(input);

    expect(result).toEqual({ error });
  });
});

import type { InitiateUploadInput } from "../../shared/types/upload.ts";

export const SMALL_SVG_IMAGE = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';

export function createUploadInput(
  overrides: Partial<InitiateUploadInput> = {},
): InitiateUploadInput {
  return {
    sample_id: "SAMPLE-123",
    filename: "scan.svg",
    classification: "Research",
    content_type: "image/svg+xml",
    content_length: 134,
    ...overrides,
  };
}

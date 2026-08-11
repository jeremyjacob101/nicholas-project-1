import {
  activeProcessingUploadIds,
  PROCESSING_START_DELAY_MS,
} from "../../server/src/helpers/upload.helper.ts";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteMinioObject: vi.fn(),
  findUploadRecordByIdAndCompanyId: vi.fn(),
  getMinioObjectStat: vi.fn(),
  processConfirmedUpload: vi.fn(),
  updateUploadStatus: vi.fn(),
}));

vi.mock("../../server/src/minio.ts", () => ({
  deleteMinioObject: mocks.deleteMinioObject,
  getMinioObjectStat: mocks.getMinioObjectStat,
}));

vi.mock("../../server/src/models/upload.model.ts", () => ({
  findUploadRecordByIdAndCompanyId: mocks.findUploadRecordByIdAndCompanyId,
  updateUploadStatus: mocks.updateUploadStatus,
}));

vi.mock("../../server/src/services/processing.service.ts", () => ({
  processConfirmedUpload: mocks.processConfirmedUpload,
}));

import { confirmUploadForCompany } from "../../server/src/services/upload-confirmation.service.ts";

const UPLOAD_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const COMPANY_ID = "11111111-1111-4111-8111-111111111111";

describe("upload confirmation background processing", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    activeProcessingUploadIds.clear();
    mocks.findUploadRecordByIdAndCompanyId.mockResolvedValue({
      id: UPLOAD_ID,
      sample_id: "SAMPLE-123",
      filename: "scan.png",
      safe_filename: "scan.png",
      classification: "Research",
      company_id: COMPANY_ID,
      created_by_user_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      object_key: `uploads/${COMPANY_ID}/${UPLOAD_ID}/scan.png`,
      status: "queued",
      created_at: "2026-08-11T08:00:00.000Z",
      updated_at: "2026-08-11T08:00:00.000Z",
    });
    mocks.getMinioObjectStat.mockResolvedValue({
      size: 1,
      metaData: { "content-type": "image/png" },
    });
    mocks.processConfirmedUpload.mockResolvedValue(undefined);
    mocks.updateUploadStatus.mockResolvedValue(undefined);
  });

  afterEach(() => {
    activeProcessingUploadIds.clear();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  test("releases the processing lock after the background job fails", async () => {
    mocks.processConfirmedUpload.mockRejectedValueOnce(
      new Error("simulated processing failure"),
    );

    const result = await confirmUploadForCompany(UPLOAD_ID, COMPANY_ID);

    expect(result).toEqual({ kind: "uploaded" });
    expect(activeProcessingUploadIds.has(UPLOAD_ID)).toBe(true);

    await vi.advanceTimersByTimeAsync(PROCESSING_START_DELAY_MS);

    expect(mocks.processConfirmedUpload).toHaveBeenCalledWith(
      UPLOAD_ID,
      COMPANY_ID,
      `uploads/${COMPANY_ID}/${UPLOAD_ID}/scan.png`,
    );
    expect(activeProcessingUploadIds.has(UPLOAD_ID)).toBe(false);
  });
});

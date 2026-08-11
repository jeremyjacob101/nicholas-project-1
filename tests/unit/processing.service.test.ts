import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const { getMinioObjectStat, transitionUploadStatus } = vi.hoisted(() => ({
  getMinioObjectStat: vi.fn(),
  transitionUploadStatus: vi.fn(),
}));

vi.mock("../../server/src/minio.ts", () => ({
  getMinioObjectStat,
}));

vi.mock("../../server/src/models/upload.model.ts", () => ({
  transitionUploadStatus,
}));

import { processConfirmedUpload } from "../../server/src/services/processing.service.ts";

const UPLOAD_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const COMPANY_ID = "11111111-1111-4111-8111-111111111111";
const OBJECT_KEY = "uploads/company/upload/scan.png";

describe("upload processing service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getMinioObjectStat.mockResolvedValue({ size: 1, metaData: {} });
    transitionUploadStatus.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  test.each([
    ["uploaded", "queued"],
    ["queued", "processing"],
    ["processing", "completed"],
  ] as const)(
    "marks the upload failed when the %s → %s transition fails",
    async (currentStatus, failedNextStatus) => {
      transitionUploadStatus.mockImplementation(
        async (
          _uploadId: string,
          _companyId: string,
          status: string,
          nextStatus: string,
        ) => nextStatus === "failed" || nextStatus !== failedNextStatus,
      );

      const processing = processConfirmedUpload(
        UPLOAD_ID,
        COMPANY_ID,
        OBJECT_KEY,
      );
      const rejection = expect(processing).rejects.toThrow(
        `Upload status could not transition from ${currentStatus} to ${failedNextStatus}`,
      );
      await vi.advanceTimersByTimeAsync(5_000);

      await rejection;
      expect(transitionUploadStatus).toHaveBeenCalledWith(
        UPLOAD_ID,
        COMPANY_ID,
        currentStatus,
        "failed",
      );
    },
  );

  test("marks processing failed when the processing operation times out", async () => {
    getMinioObjectStat.mockReturnValue(new Promise(() => undefined));

    const processing = processConfirmedUpload(
      UPLOAD_ID,
      COMPANY_ID,
      OBJECT_KEY,
    );
    const rejection = expect(processing).rejects.toThrow(
      "Image processing timed out",
    );
    await vi.advanceTimersByTimeAsync(5_000);

    await rejection;
    expect(transitionUploadStatus).toHaveBeenCalledWith(
      UPLOAD_ID,
      COMPANY_ID,
      "processing",
      "failed",
    );
  });
});

import {
  describeMinioError,
  getMinioErrorCode,
  isBucketAlreadyAvailable,
  isMinioObjectNotFound,
} from "../../server/src/helpers/storage.helper.ts";
import { describe, expect, test } from "vitest";

describe("MinIO error helpers", () => {
  test("reads MinIO error codes without assuming an Error instance", () => {
    expect(getMinioErrorCode(null)).toBeUndefined();
    expect(getMinioErrorCode({ code: "NoSuchKey" })).toBe("NoSuchKey");
    expect(getMinioErrorCode({ name: "NotFound" })).toBe("NotFound");
  });

  test("describes useful nested errors without leaking an unknown fallback", () => {
    const error = Object.assign(new Error("storage unavailable"), {
      code: "SlowDown",
      errors: [new Error("retry later"), "ignored"],
    });

    expect(describeMinioError(error)).toBe(
      "SlowDown, storage unavailable, retry later",
    );
    expect(describeMinioError(undefined)).toBe("unknown storage error");
  });

  test("classifies bucket conflicts and missing objects", () => {
    expect(isBucketAlreadyAvailable({ code: "BucketAlreadyExists" })).toBe(
      true,
    );
    expect(isBucketAlreadyAvailable({ code: "AccessDenied" })).toBe(false);

    expect(isMinioObjectNotFound({ code: "NoSuchKey" })).toBe(true);
    expect(isMinioObjectNotFound({ code: "NoSuchObject" })).toBe(true);
    expect(isMinioObjectNotFound({ code: "NotFound" })).toBe(true);
    expect(isMinioObjectNotFound({ code: "AccessDenied" })).toBe(false);
  });
});

import type { MinioErrorShape } from "../../../shared/types/storage.ts";

export function getMinioErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const errorShape = error as MinioErrorShape;

  return typeof errorShape.code === "string"
    ? errorShape.code
    : typeof errorShape.name === "string"
      ? errorShape.name
      : undefined;
}

export function describeMinioError(error: unknown): string {
  const code = getMinioErrorCode(error);
  const errorMessage = error instanceof Error ? error.message : undefined;
  const nestedMessages =
    error &&
    typeof error === "object" &&
    "errors" in error &&
    Array.isArray(error.errors)
      ? error.errors
          .filter(
            (nestedError): nestedError is Error => nestedError instanceof Error,
          )
          .map((nestedError) => nestedError.message)
      : [];
  const details = [
    code,
    errorMessage,
    nestedMessages.length > 0 ? nestedMessages.join("; ") : undefined,
  ].filter(Boolean);

  return details.length > 0 ? details.join(", ") : "unknown storage error";
}

export function isBucketAlreadyAvailable(error: unknown): boolean {
  const code = getMinioErrorCode(error);

  return code === "BucketAlreadyOwnedByYou" || code === "BucketAlreadyExists";
}

export function isMinioObjectNotFound(error: unknown): boolean {
  const code = getMinioErrorCode(error);

  return code === "NoSuchKey" || code === "NoSuchObject" || code === "NotFound";
}

import type { S3ErrorShape } from "../../../shared/types/storage.js";

export function getS3ErrorDetails(error: unknown): {
  code: string | undefined;
  statusCode: number | undefined;
} {
  if (!error || typeof error !== "object") {
    return { code: undefined, statusCode: undefined };
  }

  const errorShape = error as S3ErrorShape;
  const metadata =
    errorShape.$metadata && typeof errorShape.$metadata === "object"
      ? (errorShape.$metadata as Record<string, unknown>)
      : undefined;

  const code =
    typeof errorShape.name === "string"
      ? errorShape.name
      : typeof errorShape.Code === "string"
        ? errorShape.Code
        : undefined;

  const statusCode =
    typeof metadata?.httpStatusCode === "number"
      ? metadata.httpStatusCode
      : undefined;

  return { code, statusCode };
}

export function describeS3Error(error: unknown): string {
  const { code, statusCode } = getS3ErrorDetails(error);
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
    statusCode ? `HTTP ${statusCode}` : undefined,
    errorMessage,
    nestedMessages.length > 0 ? nestedMessages.join("; ") : undefined,
  ].filter(Boolean);

  return details.length > 0 ? details.join(", ") : "unknown storage error";
}

export function isBucketAlreadyAvailable(
  code: string | undefined,
  statusCode: number | undefined,
): boolean {
  return (
    code === "BucketAlreadyOwnedByYou" ||
    code === "BucketAlreadyExists" ||
    statusCode === 409
  );
}

export function isBucketNotFound(
  code: string | undefined,
  statusCode: number | undefined,
): boolean {
  return statusCode === 404 || code === "NotFound" || code === "NoSuchBucket";
}

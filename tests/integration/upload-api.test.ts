import type {
  CreatedUpload,
  InitiateUploadInput,
  InitiatedUpload,
  UploadRecord,
} from "../../shared/types/upload.ts";
import type { UserRecord } from "../../shared/types/user.ts";
import {
  ALICE_COMPANY_ID,
  ALICE_ID,
  BOB_ID,
  UNKNOWN_USER_ID,
} from "../fixtures/development-users.ts";
import { createUploadInput, SMALL_SVG_IMAGE } from "../fixtures/uploads.ts";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { Pool } from "pg";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  inject,
  test,
} from "vitest";

const integrationEnvironment = inject("integrationEnvironment");

type ApiResult<T> = {
  body: T;
  response: Response;
};

const INVALID_INITIATION_CASES: Array<
  [description: string, input: Record<string, unknown>, error: string]
> = [
  [
    "a missing sample ID",
    { sample_id: undefined },
    "sample_id, filename, and classification are required",
  ],
  [
    "a missing filename",
    { filename: undefined },
    "sample_id, filename, and classification are required",
  ],
  [
    "a missing classification",
    { classification: undefined },
    "sample_id, filename, and classification are required",
  ],
  [
    "a non-string sample ID",
    { sample_id: 42 },
    "sample_id, filename, and classification are required",
  ],
  [
    "a non-string filename",
    { filename: [] },
    "sample_id, filename, and classification are required",
  ],
  [
    "a non-string classification",
    { classification: {} },
    "sample_id, filename, and classification are required",
  ],
  [
    "a blank sample ID",
    { sample_id: "  " },
    "sample_id, filename, and classification are required",
  ],
  [
    "a missing content type",
    { content_type: undefined },
    "Only image files are supported",
  ],
  [
    "a non-string content type",
    { content_type: true },
    "Only image files are supported",
  ],
  [
    "a non-image content type",
    { content_type: "text/plain" },
    "Only image files are supported",
  ],
  [
    "a missing content length",
    { content_length: undefined },
    "Image must be between 1 byte and 10 MB",
  ],
  [
    "a non-number content length",
    { content_length: "1" },
    "Image must be between 1 byte and 10 MB",
  ],
  [
    "a fractional content length",
    { content_length: 1.5 },
    "Image must be between 1 byte and 10 MB",
  ],
  [
    "an empty content length",
    { content_length: 0 },
    "Image must be between 1 byte and 10 MB",
  ],
  [
    "an oversized content length",
    { content_length: 10 * 1024 * 1024 + 1 },
    "Image must be between 1 byte and 10 MB",
  ],
];

let apiServer: Server | undefined;
let apiUrl = "";
let databasePool: Pool | undefined;
let deleteMinioObject: (objectKey: string) => Promise<void>;
let ensureMinioBucket: () => Promise<void>;
let getMinioObjectStat: (objectKey: string) => Promise<{
  metaData: Record<string, unknown>;
  size: number;
}>;

function getPool(): Pool {
  if (!databasePool) {
    throw new Error("Integration database is not initialized");
  }

  return databasePool;
}

function getRequestHeaders(userId?: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(userId ? { "X-Dev-User-Id": userId } : {}),
  };
}

async function requestApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResult<T>> {
  const response = await fetch(`${apiUrl}${path}`, options);
  const body = (await response.json()) as T;

  return { body, response };
}

async function initiateUpload(
  input: Partial<InitiateUploadInput> = {},
  userId = ALICE_ID,
): Promise<ApiResult<InitiatedUpload>> {
  return requestApi<InitiatedUpload>("/api/uploads/init", {
    method: "POST",
    headers: getRequestHeaders(userId),
    body: JSON.stringify(createUploadInput(input)),
  });
}

async function initiateInvalidUpload(
  input: Record<string, unknown>,
  userId = ALICE_ID,
): Promise<ApiResult<{ error: string }>> {
  return requestApi<{ error: string }>("/api/uploads/init", {
    method: "POST",
    headers: getRequestHeaders(userId),
    body: JSON.stringify({ ...createUploadInput(), ...input }),
  });
}

async function getUploadRecord(uploadId: string): Promise<UploadRecord> {
  const result = await getPool().query<UploadRecord>(
    "SELECT * FROM uploads WHERE id = $1",
    [uploadId],
  );

  if (!result.rows[0]) {
    throw new Error(`Upload ${uploadId} was not found in the test database`);
  }

  return result.rows[0];
}

async function getUploadCount(): Promise<number> {
  const result = await getPool().query<{ count: string }>(
    "SELECT COUNT(*) AS count FROM uploads",
  );

  return Number(result.rows[0]?.count ?? 0);
}

async function putObject(
  uploadUrl: string,
  body: BodyInit,
  contentType: string,
): Promise<Response> {
  return fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body,
  });
}

async function confirmUpload(
  uploadId: string,
  userId = ALICE_ID,
): Promise<ApiResult<CreatedUpload | { error: string }>> {
  return requestApi<CreatedUpload | { error: string }>(
    `/api/uploads/${uploadId}/confirm`,
    {
      method: "POST",
      headers: userId ? { "X-Dev-User-Id": userId } : {},
    },
  );
}

async function expectObjectToBeMissing(objectKey: string): Promise<void> {
  try {
    await getMinioObjectStat(objectKey);
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? error.code
        : undefined;

    expect(["NoSuchKey", "NoSuchObject", "NotFound"]).toContain(code);
    return;
  }

  throw new Error(`Expected ${objectKey} to be missing from MinIO`);
}

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

beforeAll(async () => {
  const minio = await import("../../server/src/minio.ts");
  const database = await import("../../server/src/database.ts");
  const { default: app } = await import("../../server/src/app.ts");

  deleteMinioObject = minio.deleteMinioObject;
  ensureMinioBucket = minio.ensureMinioBucket;
  getMinioObjectStat = minio.getMinioObjectStat;
  databasePool = database.pool;

  await ensureMinioBucket();
  await ensureMinioBucket();

  apiServer = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    apiServer?.once("listening", resolve);
    apiServer?.once("error", reject);
  });

  const address = apiServer.address() as AddressInfo;
  apiUrl = `http://127.0.0.1:${address.port}`;
});

afterEach(async () => {
  if (!databasePool) {
    return;
  }

  const records = await databasePool.query<{ object_key: string }>(
    "SELECT object_key FROM uploads",
  );

  await Promise.all(
    records.rows.map(({ object_key }) =>
      deleteMinioObject(object_key).catch(() => undefined),
    ),
  );
  await databasePool.query("DELETE FROM uploads");
});

afterAll(async () => {
  await Promise.all([
    apiServer ? closeServer(apiServer) : Promise.resolve(),
    databasePool ? databasePool.end() : Promise.resolve(),
  ]);
});

describe("application availability and development users", () => {
  test("reports healthy and serves the seeded development users", async () => {
    const health = await requestApi<{ status: string }>("/health");
    const users = await requestApi<{ users: UserRecord[] }>("/api/users", {
      headers: { Origin: integrationEnvironment.clientOrigin },
    });

    expect(health.response.status).toBe(200);
    expect(health.body).toEqual({ status: "ok" });
    expect(users.response.status).toBe(200);
    expect(users.response.headers.get("access-control-allow-origin")).toBe(
      integrationEnvironment.clientOrigin,
    );
    expect(users.body.users).toEqual([
      expect.objectContaining({ id: ALICE_ID, company_id: ALICE_COMPANY_ID }),
      expect.objectContaining({ id: BOB_ID, company_name: "Hospital B" }),
    ]);
  });
});

describe("upload initialization", () => {
  test("rejects missing or unknown development users", async () => {
    const missingUser = await requestApi<{ error: string }>(
      "/api/uploads/init",
      {
        method: "POST",
        headers: getRequestHeaders(),
        body: JSON.stringify(createUploadInput()),
      },
    );
    const unknownUser = await initiateUpload({}, UNKNOWN_USER_ID);

    expect(missingUser.response.status).toBe(401);
    expect(missingUser.body).toEqual({ error: "A current user is required" });
    expect(unknownUser.response.status).toBe(401);
    expect(unknownUser.body).toEqual({ error: "Invalid current user" });
  });

  test.each(INVALID_INITIATION_CASES)(
    "rejects %s without creating an upload record",
    async (_description, input, error) => {
      const result = await initiateInvalidUpload(input);

      expect(result.response.status).toBe(400);
      expect(result.body).toEqual({ error });
      expect(await getUploadCount()).toBe(0);
    },
  );

  test("creates a queued record with a server-scoped key and short-lived upload URL", async () => {
    const result = await requestApi<InitiatedUpload>("/api/uploads/init", {
      method: "POST",
      headers: getRequestHeaders(ALICE_ID),
      body: JSON.stringify({
        ...createUploadInput(),
        object_key: "uploads/hospital-b/stolen.svg",
        company_id: "22222222-2222-4222-8222-222222222222",
      }),
    });

    expect(result.response.status).toBe(201);
    expect(result.body.upload.status).toBe("queued");
    expect(Object.keys(result.body).sort()).toEqual([
      "expiresAt",
      "upload",
      "uploadUrl",
    ]);
    expect(result.body.uploadUrl).toContain("X-Amz-Expires=300");
    expect(result.body.uploadUrl).not.toContain(
      integrationEnvironment.minioRootPassword,
    );

    const secondsUntilExpiry =
      (Date.parse(result.body.expiresAt) - Date.now()) / 1_000;
    expect(secondsUntilExpiry).toBeGreaterThan(280);
    expect(secondsUntilExpiry).toBeLessThanOrEqual(300);

    const record = await getUploadRecord(result.body.upload.id);
    expect(record).toMatchObject({
      company_id: ALICE_COMPANY_ID,
      created_by_user_id: ALICE_ID,
      status: "queued",
      object_key: `uploads/${ALICE_COMPANY_ID}/${record.id}/scan.svg`,
    });
  });
});

describe("presigned upload and confirmation", () => {
  test("stores a browser-style upload privately and confirms it as uploaded", async () => {
    const image = SMALL_SVG_IMAGE;
    const initiated = await initiateUpload({
      content_length: Buffer.byteLength(image),
    });

    expect(initiated.response.status).toBe(201);

    const preflight = await fetch(initiated.body.uploadUrl, {
      method: "OPTIONS",
      headers: {
        Origin: integrationEnvironment.clientOrigin,
        "Access-Control-Request-Method": "PUT",
        "Access-Control-Request-Headers": "content-type",
      },
    });
    expect(preflight.status).toBeLessThan(300);
    expect(preflight.headers.get("access-control-allow-origin")).toBe(
      integrationEnvironment.clientOrigin,
    );

    const putResponse = await putObject(
      initiated.body.uploadUrl,
      image,
      "image/svg+xml",
    );
    expect(putResponse.status).toBe(200);

    const recordBeforeConfirmation = await getUploadRecord(
      initiated.body.upload.id,
    );
    const objectBeforeConfirmation = await getMinioObjectStat(
      recordBeforeConfirmation.object_key,
    );
    expect(objectBeforeConfirmation.size).toBe(Buffer.byteLength(image));
    expect(objectBeforeConfirmation.metaData["content-type"]).toBe(
      "image/svg+xml",
    );

    const anonymousGet = await fetch(
      `http://${integrationEnvironment.appHost}:${integrationEnvironment.minioPort}/${integrationEnvironment.minioBucket}/${recordBeforeConfirmation.object_key}`,
    );
    expect(anonymousGet.status).toBe(403);

    const confirmation = await confirmUpload(initiated.body.upload.id);
    expect(confirmation.response.status).toBe(200);
    expect(confirmation.body).toEqual({
      id: initiated.body.upload.id,
      status: "uploaded",
    });
    expect((await getUploadRecord(initiated.body.upload.id)).status).toBe(
      "uploaded",
    );
  });

  test("allows an owner to repeat confirmation without changing the result", async () => {
    const image = "image bytes";
    const initiated = await initiateUpload({ content_length: image.length });

    await putObject(initiated.body.uploadUrl, image, "image/png");
    await confirmUpload(initiated.body.upload.id);

    const repeatedConfirmation = await confirmUpload(initiated.body.upload.id);
    expect(repeatedConfirmation.response.status).toBe(200);
    expect(repeatedConfirmation.body).toEqual({
      id: initiated.body.upload.id,
      status: "uploaded",
    });
  });

  test("does not reveal or update another company's queued upload", async () => {
    const initiated = await initiateUpload();

    const bobConfirmation = await confirmUpload(
      initiated.body.upload.id,
      BOB_ID,
    );
    expect(bobConfirmation.response.status).toBe(404);
    expect(bobConfirmation.body).toEqual({ error: "Upload not found" });
    expect((await getUploadRecord(initiated.body.upload.id)).status).toBe(
      "queued",
    );
  });

  test("marks a missing object as failed", async () => {
    const initiated = await initiateUpload();

    const confirmation = await confirmUpload(initiated.body.upload.id);
    expect(confirmation.response.status).toBe(400);
    expect(confirmation.body).toEqual({
      error: "Uploaded image was not found",
    });
    expect((await getUploadRecord(initiated.body.upload.id)).status).toBe(
      "failed",
    );
  });

  test("rejects and deletes an empty image object", async () => {
    const initiated = await initiateUpload({ content_length: 1 });
    const record = await getUploadRecord(initiated.body.upload.id);

    const putResponse = await putObject(
      initiated.body.uploadUrl,
      Buffer.alloc(0),
      "image/png",
    );
    expect(putResponse.status).toBe(200);
    expect((await getMinioObjectStat(record.object_key)).size).toBe(0);

    const confirmation = await confirmUpload(initiated.body.upload.id);
    expect(confirmation.response.status).toBe(400);
    expect(confirmation.body).toEqual({
      error: "Image must be between 1 byte and 10 MB",
    });
    expect((await getUploadRecord(initiated.body.upload.id)).status).toBe(
      "failed",
    );
    await expectObjectToBeMissing(record.object_key);
  });

  test("rejects and deletes an object whose stored content type is not an image", async () => {
    const body = "not an image";
    const initiated = await initiateUpload({ content_length: body.length });
    const record = await getUploadRecord(initiated.body.upload.id);

    await putObject(initiated.body.uploadUrl, body, "text/plain");

    const confirmation = await confirmUpload(initiated.body.upload.id);
    expect(confirmation.response.status).toBe(400);
    expect(confirmation.body).toEqual({
      error: "Only image files are supported",
    });
    expect((await getUploadRecord(initiated.body.upload.id)).status).toBe(
      "failed",
    );
    await expectObjectToBeMissing(record.object_key);
  });

  test("rejects and deletes an object larger than 10 MB", async () => {
    const body = Buffer.alloc(10 * 1024 * 1024 + 1);
    const initiated = await initiateUpload({ content_length: 1 });
    const record = await getUploadRecord(initiated.body.upload.id);

    await putObject(initiated.body.uploadUrl, body, "image/png");

    const confirmation = await confirmUpload(initiated.body.upload.id);
    expect(confirmation.response.status).toBe(400);
    expect(confirmation.body).toEqual({
      error: "Image must be between 1 byte and 10 MB",
    });
    expect((await getUploadRecord(initiated.body.upload.id)).status).toBe(
      "failed",
    );
    await expectObjectToBeMissing(record.object_key);
  });

  test("handles rapid concurrent upload flows as independent records", async () => {
    const uploadCount = 5;
    const contentLength = Buffer.byteLength(SMALL_SVG_IMAGE);
    const initiatedUploads = await Promise.all(
      Array.from({ length: uploadCount }, () =>
        initiateUpload({ content_length: contentLength }),
      ),
    );

    expect(initiatedUploads.map(({ response }) => response.status)).toEqual(
      Array.from({ length: uploadCount }, () => 201),
    );

    const uploadIds = initiatedUploads.map(({ body }) => body.upload.id);
    expect(new Set(uploadIds).size).toBe(uploadCount);

    const records = await Promise.all(uploadIds.map(getUploadRecord));
    expect(records.every((record) => record.status === "queued")).toBe(true);
    expect(
      records.every((record) => record.company_id === ALICE_COMPANY_ID),
    ).toBe(true);
    expect(new Set(records.map((record) => record.object_key)).size).toBe(
      uploadCount,
    );

    const storageResponses = await Promise.all(
      initiatedUploads.map(({ body }) =>
        putObject(body.uploadUrl, SMALL_SVG_IMAGE, "image/svg+xml"),
      ),
    );
    expect(storageResponses.map(({ status }) => status)).toEqual(
      Array.from({ length: uploadCount }, () => 200),
    );

    const confirmations = await Promise.all(
      uploadIds.map((uploadId) => confirmUpload(uploadId)),
    );
    expect(confirmations.map(({ response }) => response.status)).toEqual(
      Array.from({ length: uploadCount }, () => 200),
    );
    expect(confirmations.map(({ body }) => body)).toEqual(
      uploadIds.map((id) => ({ id, status: "uploaded" })),
    );
    expect(
      (await Promise.all(uploadIds.map(getUploadRecord))).every(
        (record) => record.status === "uploaded",
      ),
    ).toBe(true);
  });
});

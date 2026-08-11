import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { Client } from "minio";
import { e2eEnvironment, e2eProcessEnvironment } from "./e2e-environment.ts";

type RunResult = {
  stdout: string;
  stderr: string;
};

function runCommand(
  command: string,
  args: string[],
  input?: string,
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: e2eEnvironment.projectRoot,
      env: e2eProcessEnvironment,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(
        new Error(
          `${command} ${args.join(" ")} failed with exit code ${code}\n${stderr}`,
        ),
      );
    });

    if (input !== undefined) {
      child.stdin.write(input);
    }
    child.stdin.end();
  });
}

async function wait(durationMs: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

async function waitForPostgres(): Promise<void> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      await runCommand("docker", [
        "compose",
        "--file",
        e2eEnvironment.composeFile,
        "--project-name",
        e2eEnvironment.composeProjectName,
        "exec",
        "-T",
        "postgres",
        "pg_isready",
        "-U",
        e2eEnvironment.postgresUser,
        "-d",
        e2eEnvironment.postgresDatabase,
      ]);
      return;
    } catch (error) {
      lastError = error;
      await wait(1_000);
    }
  }

  throw new Error(`PostgreSQL did not become ready: ${String(lastError)}`);
}

async function waitForMinio(): Promise<void> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(
        `${e2eEnvironment.minioUrl}/minio/health/live`,
      );

      if (response.ok) {
        const corsResponse = await fetch(
          `${e2eEnvironment.minioUrl}/${e2eEnvironment.minioBucket}/e2e-readiness`,
          {
            method: "OPTIONS",
            headers: {
              Origin: e2eEnvironment.clientOrigin,
              "Access-Control-Request-Method": "PUT",
              "Access-Control-Request-Headers": "content-type",
            },
          },
        );

        if (
          corsResponse.ok &&
          corsResponse.headers.get("access-control-allow-origin") ===
            e2eEnvironment.clientOrigin
        ) {
          return;
        }

        lastError = new Error(
          `MinIO CORS preflight returned HTTP ${corsResponse.status}`,
        );
      } else {
        lastError = new Error(`MinIO returned HTTP ${response.status}`);
      }
    } catch (error) {
      lastError = error;
    }

    await wait(1_000);
  }

  throw new Error(`MinIO did not become ready: ${String(lastError)}`);
}

async function ensureMinioBucket(): Promise<void> {
  const client = new Client({
    endPoint: e2eEnvironment.appHost,
    port: Number(e2eEnvironment.minioPort),
    useSSL: false,
    pathStyle: true,
    accessKey: e2eEnvironment.minioRootUser,
    secretKey: e2eEnvironment.minioRootPassword,
    region: e2eEnvironment.minioRegion,
  });

  if (await client.bucketExists(e2eEnvironment.minioBucket)) {
    return;
  }

  await client.makeBucket(
    e2eEnvironment.minioBucket,
    e2eEnvironment.minioRegion,
  );
}

export default async function startE2EServices(): Promise<void> {
  await runCommand("docker", [
    "compose",
    "--file",
    e2eEnvironment.composeFile,
    "--project-name",
    e2eEnvironment.composeProjectName,
    "down",
    "--volumes",
    "--remove-orphans",
  ]);
  await runCommand("docker", [
    "compose",
    "--file",
    e2eEnvironment.composeFile,
    "--project-name",
    e2eEnvironment.composeProjectName,
    "up",
    "--detach",
    "--wait",
    "postgres",
    "minio",
  ]);
  await Promise.all([waitForPostgres(), waitForMinio()]);
  await ensureMinioBucket();

  const schema = await readFile(
    `${e2eEnvironment.projectRoot}/server/sql/schema.sql`,
    "utf8",
  );
  await runCommand(
    "docker",
    [
      "compose",
      "--file",
      e2eEnvironment.composeFile,
      "--project-name",
      e2eEnvironment.composeProjectName,
      "exec",
      "-T",
      "postgres",
      "psql",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      e2eEnvironment.postgresUser,
      "-d",
      e2eEnvironment.postgresDatabase,
    ],
    schema,
  );
}

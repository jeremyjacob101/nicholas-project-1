import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function readEnvironmentFile(path: string): Record<string, string> {
  return existsSync(path) ? dotenv.parse(readFileSync(path)) : {};
}

const environment = {
  ...readEnvironmentFile(resolve(projectRoot, ".env.example")),
  ...readEnvironmentFile(resolve(projectRoot, ".env")),
  ...process.env,
};

const appHost = environment.APP_HOST ?? "localhost";
const apiPort = environment.PORT ?? "2514";
const clientPort = environment.VITE_PORT ?? "2513";

export const e2eEnvironment = {
  apiUrl: `http://${appHost}:${apiPort}`,
  clientUrl: `http://${appHost}:${clientPort}`,
  composeEnvironmentFile: existsSync(resolve(projectRoot, ".env"))
    ? resolve(projectRoot, ".env")
    : resolve(projectRoot, ".env.example"),
  minioUrl: `http://${appHost}:${environment.MINIO_API_HOST_PORT ?? "9000"}`,
  postgresDatabase: environment.POSTGRES_DB ?? "research_uploads",
  postgresUser: environment.POSTGRES_USER ?? "research_uploads_user",
  projectRoot,
};

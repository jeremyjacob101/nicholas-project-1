/// <reference types="node" />

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const appHost = "127.0.0.1";
const apiPort = "3514";
const clientPort = "3513";
const minioPort = "39000";
const minioConsolePort = "39001";
const postgresPort = "35432";
const postgresUser = "e2e_uploads_user";
const postgresPassword = "e2e-postgres-password";
const postgresDatabase = "e2e_research_uploads";
const minioRootUser = "e2e-minio-admin";
const minioRootPassword = "e2e-minio-password";
const minioBucket = "research-images-e2e";
const clientOrigin = `http://${appHost}:${clientPort}`;
const apiUrl = `http://${appHost}:${apiPort}`;
const inheritedProcessEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(
    (entry): entry is [string, string] => entry[1] !== undefined,
  ),
);

export const e2eEnvironment = {
  appHost,
  apiUrl,
  clientOrigin,
  clientPort,
  clientUrl: clientOrigin,
  composeFile: resolve(projectRoot, "docker-compose.e2e.yml"),
  composeProjectName: "research-image-upload-e2e",
  minioBucket,
  minioPort,
  minioRegion: "us-east-1",
  minioRootPassword,
  minioRootUser,
  minioUrl: `http://${appHost}:${minioPort}`,
  postgresDatabase,
  postgresHost: appHost,
  postgresPassword,
  postgresPort,
  postgresUser,
  projectRoot,
};

export const e2eProcessEnvironment: Record<string, string> = {
  ...inheritedProcessEnvironment,
  APP_HOST: appHost,
  CLIENT_ORIGIN: clientOrigin,
  MINIO_API_HOST_PORT: minioPort,
  MINIO_BUCKET: minioBucket,
  MINIO_CONSOLE_HOST_PORT: minioConsolePort,
  MINIO_REGION: "us-east-1",
  MINIO_ROOT_PASSWORD: minioRootPassword,
  MINIO_ROOT_USER: minioRootUser,
  POSTGRES_DB: postgresDatabase,
  POSTGRES_HOST_PORT: postgresPort,
  POSTGRES_PASSWORD: postgresPassword,
  POSTGRES_USER: postgresUser,
  PORT: apiPort,
  VITE_API_URL: apiUrl,
  VITE_PORT: clientPort,
};

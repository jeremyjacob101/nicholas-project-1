import { inject } from "vitest";

const environment = inject("integrationEnvironment");

Object.assign(process.env, {
  APP_HOST: environment.appHost,
  CLIENT_ORIGIN: environment.clientOrigin,
  MINIO_API_HOST_PORT: environment.minioPort,
  MINIO_BUCKET: environment.minioBucket,
  MINIO_REGION: environment.minioRegion,
  MINIO_ROOT_PASSWORD: environment.minioRootPassword,
  MINIO_ROOT_USER: environment.minioRootUser,
  PORT: "0",
  POSTGRES_DB: environment.postgresDatabase,
  POSTGRES_HOST_PORT: environment.postgresPort,
  POSTGRES_PASSWORD: environment.postgresPassword,
  POSTGRES_USER: environment.postgresUser,
  VITE_PORT: "2513",
});

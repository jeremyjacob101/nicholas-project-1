import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  GenericContainer,
  type StartedTestContainer,
  Wait,
} from "testcontainers";
import type { TestProject } from "vitest/node";

type IntegrationEnvironment = {
  appHost: string;
  clientOrigin: string;
  minioBucket: string;
  minioPort: string;
  minioRootPassword: string;
  minioRootUser: string;
  minioRegion: string;
  postgresDatabase: string;
  postgresPassword: string;
  postgresPort: string;
  postgresUser: string;
};

declare module "vitest" {
  export interface ProvidedContext {
    integrationEnvironment: IntegrationEnvironment;
  }
}

const MINIO_IMAGE = "minio/minio:RELEASE.2025-05-24T17-08-30Z";
const POSTGRES_IMAGE = "postgres:18.4";
const TEST_MINIO_BUCKET = "research-images-test";
const TEST_MINIO_ROOT_USER = "test-minio-access";
const TEST_MINIO_ROOT_PASSWORD = "test-minio-secret";
const TEST_POSTGRES_DATABASE = "research_images_test";
const TEST_POSTGRES_USER = "test_user";
const TEST_POSTGRES_PASSWORD = "test_password";
const TEST_CLIENT_ORIGIN = "http://test-client.local";

export default async function startIntegrationServices(project: TestProject) {
  let postgres: StartedPostgreSqlContainer | undefined;
  let minio: StartedTestContainer | undefined;

  try {
    postgres = await new PostgreSqlContainer(POSTGRES_IMAGE)
      .withDatabase(TEST_POSTGRES_DATABASE)
      .withUsername(TEST_POSTGRES_USER)
      .withPassword(TEST_POSTGRES_PASSWORD)
      .start();

    minio = await new GenericContainer(MINIO_IMAGE)
      .withEnvironment({
        MINIO_ROOT_USER: TEST_MINIO_ROOT_USER,
        MINIO_ROOT_PASSWORD: TEST_MINIO_ROOT_PASSWORD,
        MINIO_API_CORS_ALLOW_ORIGIN: TEST_CLIENT_ORIGIN,
      })
      .withCommand(["server", "/data"])
      .withExposedPorts(9000)
      .withWaitStrategy(
        Wait.forHttp("/minio/health/live", 9000).forStatusCode(200),
      )
      .start();

    const { Client } = pg;
    const appHost = postgres.getHost();

    if (minio.getHost() !== appHost) {
      throw new Error("Testcontainers services must share a host");
    }

    const schema = await readFile(
      resolve(
        dirname(fileURLToPath(import.meta.url)),
        "../../server/sql/schema.sql",
      ),
      "utf8",
    );
    const database = new Client({
      host: postgres.getHost(),
      port: postgres.getPort(),
      user: postgres.getUsername(),
      password: postgres.getPassword(),
      database: postgres.getDatabase(),
    });

    await database.connect();
    await database.query(schema);
    await database.end();

    const environment: IntegrationEnvironment = {
      appHost,
      clientOrigin: TEST_CLIENT_ORIGIN,
      minioBucket: TEST_MINIO_BUCKET,
      minioPort: String(minio.getMappedPort(9000)),
      minioRootPassword: TEST_MINIO_ROOT_PASSWORD,
      minioRootUser: TEST_MINIO_ROOT_USER,
      minioRegion: "us-east-1",
      postgresDatabase: postgres.getDatabase(),
      postgresPassword: postgres.getPassword(),
      postgresPort: String(postgres.getPort()),
      postgresUser: postgres.getUsername(),
    };

    project.provide("integrationEnvironment", environment);

    return async () => {
      await Promise.all([minio?.stop(), postgres?.stop()]);
    };
  } catch (error) {
    await Promise.allSettled([minio?.stop(), postgres?.stop()]);
    throw error;
  }
}

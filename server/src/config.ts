import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const exampleEnvironmentFile = resolve(projectRoot, ".env.example");
const localEnvironmentFile = resolve(projectRoot, ".env");

if (existsSync(exampleEnvironmentFile)) {
  dotenv.config({ path: exampleEnvironmentFile });
}

if (existsSync(localEnvironmentFile)) {
  dotenv.config({ path: localEnvironmentFile, override: true });
}

process.env.CLIENT_ORIGIN = `http://${process.env.APP_HOST}:${process.env.VITE_PORT}`;

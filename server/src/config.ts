import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const exampleEnvironmentFile = resolve(projectRoot, ".env.example");
const localEnvironmentFile = resolve(projectRoot, ".env");

function readEnvironmentFile(environmentFile: string): Record<string, string> {
  return existsSync(environmentFile)
    ? dotenv.parse(readFileSync(environmentFile))
    : {};
}

const configuredEnvironment = {
  ...readEnvironmentFile(exampleEnvironmentFile),
  ...readEnvironmentFile(localEnvironmentFile),
};

for (const [name, value] of Object.entries(configuredEnvironment)) {
  if (process.env[name] === undefined) {
    process.env[name] = value;
  }
}

process.env.CLIENT_ORIGIN ??= `http://${process.env.APP_HOST}:${process.env.VITE_PORT}`;

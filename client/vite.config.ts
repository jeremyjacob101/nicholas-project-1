import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const envDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const exampleEnvironmentFile = resolve(envDir, ".env.example");
const localEnvironmentFile = resolve(envDir, ".env");

const exampleEnvironment = existsSync(exampleEnvironmentFile)
  ? dotenv.parse(readFileSync(exampleEnvironmentFile))
  : {};
const localEnvironment = existsSync(localEnvironmentFile)
  ? dotenv.parse(readFileSync(localEnvironmentFile))
  : {};
const environment = {
  ...exampleEnvironment,
  ...localEnvironment,
  APP_HOST:
    process.env.APP_HOST ??
    localEnvironment.APP_HOST ??
    exampleEnvironment.APP_HOST,
  PORT: process.env.PORT ?? localEnvironment.PORT ?? exampleEnvironment.PORT,
  VITE_PORT:
    process.env.VITE_PORT ??
    localEnvironment.VITE_PORT ??
    exampleEnvironment.VITE_PORT,
};

for (const [name, value] of Object.entries(environment)) {
  if (name.startsWith("VITE_")) {
    process.env[name] = value;
  }
}

process.env.VITE_API_URL ??= `http://${environment.APP_HOST}:${environment.PORT}`;

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, "VITE_");

  return {
    envDir,
    plugins: [react()],
    server: {
      host: process.env.APP_HOST ?? env.APP_HOST,
      port: Number(process.env.VITE_PORT ?? env.VITE_PORT),
      strictPort: true,
    },
  };
});

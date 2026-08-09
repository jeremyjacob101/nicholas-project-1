import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const envDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, "VITE_");

  return {
    envDir,
    plugins: [react()],
    server: { port: Number(env.VITE_PORT), strictPort: true },
  };
});

/// <reference types="node" />

import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { e2eEnvironment, e2eProcessEnvironment } from "./e2e-environment.ts";
import startE2EServices from "./start-e2e-services.ts";
import stopE2EServices from "./stop-e2e-services.ts";

function runPlaywright(args: string[]): Promise<number> {
  return new Promise((resolveExitCode, reject) => {
    const playwright = spawn(
      process.execPath,
      [
        resolve(e2eEnvironment.projectRoot, "node_modules/playwright/cli.js"),
        "test",
        "--config=playwright.config.ts",
        ...args,
      ],
      {
        cwd: e2eEnvironment.projectRoot,
        env: e2eProcessEnvironment,
        stdio: "inherit",
      },
    );

    playwright.once("error", reject);
    playwright.once("close", (code) => {
      resolveExitCode(code ?? 1);
    });
  });
}

async function main(): Promise<void> {
  let exitCode = 1;

  try {
    await startE2EServices();
    exitCode = await runPlaywright(process.argv.slice(2));
  } finally {
    await stopE2EServices();
  }

  process.exitCode = exitCode;
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

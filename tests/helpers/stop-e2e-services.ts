import { spawn } from "node:child_process";
import { e2eEnvironment, e2eProcessEnvironment } from "./e2e-environment.ts";

function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: e2eEnvironment.projectRoot,
      env: e2eProcessEnvironment,
      stdio: "inherit",
    });

    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(`${command} ${args.join(" ")} failed with exit code ${code}`),
      );
    });
  });
}

export default async function stopE2EServices(): Promise<void> {
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
}

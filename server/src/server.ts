import app from "./app.js";
import { ensureMinioBucket } from "./minio.js";

const PORT = Number(process.env.PORT);
const APP_HOST = process.env.APP_HOST!;

async function startServer(): Promise<void> {
  try {
    await ensureMinioBucket();

    app.listen(PORT, () => {
      console.log(`Server running on http://${APP_HOST}:${PORT}`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Unable to start server: ${message}`);
    process.exitCode = 1;
  }
}

void startServer();

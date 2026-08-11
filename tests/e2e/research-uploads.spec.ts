import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { e2eEnvironment } from "../helpers/e2e-environment.ts";

const SVG_IMAGE = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';

async function selectDevelopmentUser(
  page: Page,
  userName: string,
  companyName: string,
): Promise<string> {
  const usersResponse = await page.request.get(
    `${e2eEnvironment.apiUrl}/api/users`,
  );
  const users = (await usersResponse.json()) as {
    users: Array<{
      id: string;
      name: string;
      company_name: string;
    }>;
  };
  const user = users.users.find(
    (candidate) =>
      candidate.name === userName && candidate.company_name === companyName,
  );

  if (!user) {
    throw new Error(`Could not find the development user ${userName}`);
  }

  await page.getByRole("button", { name: `Switch to ${userName}` }).click();
  return user.id;
}

async function waitForUsers(page: Page): Promise<void> {
  await expect(
    page.getByRole("button", { name: "Switch to Alice" }),
  ).toBeEnabled();
}

async function uploadImage(
  page: Page,
  userId: string,
  filename: string,
  mimeType = "image/svg+xml",
  contents = SVG_IMAGE,
): Promise<string> {
  await page.getByLabel("Sample ID").fill(`E2E-${filename}`);
  await page.getByLabel("Classification").fill("Research");
  await page.getByLabel("File").setInputFiles({
    name: filename,
    mimeType,
    buffer: Buffer.from(contents),
  });
  await page.getByRole("button", { name: "Upload Image" }).click();

  const row = page.locator(".upload-list-item").filter({ hasText: filename });
  const downloadButton = row.getByRole("button", {
    name: `Download ${filename}`,
  });

  await expect(row).toBeVisible();
  await expect(downloadButton).toBeDisabled();
  await expect(row).toContainText("completed", { timeout: 15_000 });
  await expect(downloadButton).toBeEnabled();
  await expect(page.getByLabel("Sample ID")).toHaveValue("");
  await expect(page.getByLabel("Classification")).toHaveValue("");
  await expect(page.getByLabel("File")).toHaveValue("");
  await expect(page.locator(".file-dropzone-label strong")).toHaveText(
    "Choose an image file",
  );

  const uploadsResponse = await page.request.get(
    `${e2eEnvironment.apiUrl}/api/uploads`,
    { headers: { "X-Dev-User-Id": userId } },
  );
  const uploads = (await uploadsResponse.json()) as {
    uploads: Array<{ id: string; filename: string }>;
  };
  const upload = uploads.uploads.find(
    (candidate) => candidate.filename === filename,
  );

  if (!upload) {
    throw new Error("The completed upload was not returned by the API");
  }

  return upload.id;
}

test.describe("research image uploads", () => {
  test("Hospital A can upload, see completion, and download its image", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForUsers(page);
    const aliceId = await selectDevelopmentUser(page, "Alice", "Hospital A");

    const filename = `alice-${Date.now()}.svg`;
    await uploadImage(page, aliceId, filename);

    const row = page.locator(".upload-list-item").filter({ hasText: filename });
    const downloadPromise = page.waitForEvent("download");
    await row.getByRole("button", { name: `Download ${filename}` }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe(filename);
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    if (downloadPath) {
      expect(await readFile(downloadPath, "utf8")).toBe(SVG_IMAGE);
    }
  });

  test("Hospital B cannot see or obtain a download URL for Hospital A's image", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    await waitForUsers(page);
    const aliceId = await selectDevelopmentUser(page, "Alice", "Hospital A");
    const filename = `private-${Date.now()}.svg`;
    const uploadId = await uploadImage(page, aliceId, filename);

    await page.getByLabel("Sample ID").fill("cleared-on-switch");
    await page.getByLabel("Classification").fill("Temporary");
    await page.getByLabel("File").setInputFiles({
      name: "switch-me.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from(SVG_IMAGE),
    });

    const bobId = await selectDevelopmentUser(page, "Bob", "Hospital B");
    await expect(page.getByLabel("Sample ID")).toHaveValue("");
    await expect(page.getByLabel("Classification")).toHaveValue("");
    await expect(page.getByLabel("File")).toHaveValue("");
    await expect(page.locator(".file-dropzone-label strong")).toHaveText(
      "Choose an image file",
    );
    await expect(
      page.locator(".upload-list-item").filter({ hasText: filename }),
    ).toHaveCount(0);

    const bobDownloadAttempt = await request.get(
      `${e2eEnvironment.apiUrl}/api/uploads/${uploadId}/download`,
      { headers: { "X-Dev-User-Id": bobId } },
    );

    expect(bobDownloadAttempt.status()).toBe(404);
    await expect(bobDownloadAttempt.json()).resolves.toEqual({
      error: "Upload not found",
    });
    expect(aliceId).not.toBe(bobId);
  });

  test("shows a clear error when the server rejects non-image metadata", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForUsers(page);
    await selectDevelopmentUser(page, "Alice", "Hospital A");

    await page.getByLabel("Sample ID").fill("E2E-invalid-file");
    await page.getByLabel("Classification").fill("Research");
    await page.getByLabel("File").setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not an image"),
    });
    await page.getByRole("button", { name: "Upload Image" }).click();

    await expect(page.locator(".message.error")).toContainText(
      "Only image files are supported",
    );
  });
});

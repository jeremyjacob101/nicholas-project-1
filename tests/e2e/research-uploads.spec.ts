import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { e2eEnvironment } from "../helpers/e2e-environment.ts";

const SVG_IMAGE = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';

async function selectDevelopmentUser(
  page: Page,
  userName: string,
  companyName: string,
): Promise<string> {
  const option = page
    .locator("#current-user option")
    .filter({ hasText: `${userName} — ${companyName}` });
  const userId = await option.getAttribute("value");

  if (!userId) {
    throw new Error(`Could not find the development user ${userName}`);
  }

  await page.getByLabel("Current user").selectOption(userId);
  return userId;
}

async function waitForUsers(page: Page): Promise<void> {
  await expect(page.getByLabel("Current user")).toBeEnabled();
}

async function uploadImage(
  page: Page,
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
  await expect(row).toContainText("completed", { timeout: 15_000 });

  const uploadId = await page
    .locator(".result p")
    .filter({ hasText: "ID:" })
    .textContent();

  if (!uploadId) {
    throw new Error("The completed upload did not display an upload ID");
  }

  return uploadId.replace(/^ID:\s*/, "").trim();
}

test.describe("research image uploads", () => {
  test("Hospital A can upload, see completion, and download its image", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForUsers(page);
    await selectDevelopmentUser(page, "Alice", "Hospital A");

    const filename = `alice-${Date.now()}.svg`;
    await uploadImage(page, filename);

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
    const uploadId = await uploadImage(page, filename);

    const bobId = await selectDevelopmentUser(page, "Bob", "Hospital B");
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

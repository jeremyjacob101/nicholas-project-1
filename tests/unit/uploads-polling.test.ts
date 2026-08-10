import type { AuthorizedUpload } from "../../shared/types/upload.ts";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  effectCallbacks: [] as Array<() => void | (() => void)>,
  fetchUploads: vi.fn(),
  stateSetters: [] as Array<ReturnType<typeof vi.fn>>,
}));

vi.mock("react", () => ({
  useCallback: (callback: unknown) => callback,
  useEffect: (effect: () => void | (() => void)) => {
    mocks.effectCallbacks.push(effect);
  },
  useState: (initialValue: unknown) => {
    const setState = vi.fn();
    mocks.stateSetters.push(setState);
    return [initialValue, setState];
  },
}));

vi.mock("../../client/src/api/uploads.api", () => ({
  fetchUploads: mocks.fetchUploads,
}));

import { useUploads } from "../../client/src/hooks/useUploads.ts";

const BASE_UPLOAD: AuthorizedUpload = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  sample_id: "SAMPLE-123",
  filename: "scan.png",
  classification: "Research",
  status: "completed",
  created_at: "2026-08-10T08:00:00.000Z",
};

function uploadWithStatus(
  status: AuthorizedUpload["status"],
): AuthorizedUpload {
  return { ...BASE_UPLOAD, status };
}

function flushPromises(): Promise<void> {
  return Promise.resolve().then(() => undefined);
}

function mountUploads(userId = "alice"): () => void {
  useUploads(userId);
  const effect = mocks.effectCallbacks.at(-1);

  if (!effect) {
    throw new Error("Expected useUploads to register an effect");
  }

  return effect() as () => void;
}

describe("useUploads polling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.effectCallbacks.length = 0;
    mocks.stateSetters.length = 0;
    mocks.fetchUploads.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("polls active statuses and stops after a terminal status", async () => {
    mocks.fetchUploads
      .mockResolvedValueOnce([uploadWithStatus("processing")])
      .mockResolvedValueOnce([uploadWithStatus("completed")]);

    const cleanup = mountUploads();
    await flushPromises();

    expect(mocks.fetchUploads).toHaveBeenCalledWith("alice");
    expect(mocks.fetchUploads).toHaveBeenCalledOnce();

    await vi.advanceTimersByTimeAsync(250);
    expect(mocks.fetchUploads).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(500);
    expect(mocks.fetchUploads).toHaveBeenCalledTimes(2);
    expect(mocks.stateSetters[0]).toHaveBeenLastCalledWith({
      userId: "alice",
      refreshVersion: 0,
      uploads: [uploadWithStatus("completed")],
      error: null,
    });

    cleanup();
  });

  test("ignores an in-flight result after cleanup", async () => {
    let resolveFetch!: (uploads: AuthorizedUpload[]) => void;
    mocks.fetchUploads.mockReturnValue(
      new Promise<AuthorizedUpload[]>((resolve) => {
        resolveFetch = resolve;
      }),
    );

    const cleanup = mountUploads();
    cleanup();
    resolveFetch([uploadWithStatus("processing")]);
    await flushPromises();

    expect(mocks.stateSetters[0]).not.toHaveBeenCalled();
  });

  test("does not overlap requests while a previous poll is pending", async () => {
    let resolveFetch!: (uploads: AuthorizedUpload[]) => void;
    mocks.fetchUploads.mockReturnValue(
      new Promise<AuthorizedUpload[]>((resolve) => {
        resolveFetch = resolve;
      }),
    );

    const cleanup = mountUploads();
    await vi.advanceTimersByTimeAsync(750);
    expect(mocks.fetchUploads).toHaveBeenCalledOnce();

    resolveFetch([uploadWithStatus("processing")]);
    await flushPromises();
    await vi.advanceTimersByTimeAsync(250);

    expect(mocks.fetchUploads).toHaveBeenCalledTimes(2);
    cleanup();
  });
});

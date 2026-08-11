import type {
  CurrentUserLocals,
  CurrentUserRecord,
} from "../../shared/types/user.ts";
import type { NextFunction, Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const { findUserById } = vi.hoisted(() => ({
  findUserById: vi.fn(),
}));

vi.mock("../../server/src/models/user.model.ts", () => ({
  findUserById,
}));

import { requireCurrentUser } from "../../server/src/middleware/require-current-user.middleware.ts";

const currentUser: CurrentUserRecord = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  name: "Alice",
  email: "alice@hospital-a.local",
  company_id: "11111111-1111-4111-8111-111111111111",
  company_name: "Hospital A",
};

function createRequest(devUserId?: string): Request {
  return {
    header: vi.fn((name: string) =>
      name === "X-Dev-User-Id" ? devUserId : undefined,
    ),
  } as unknown as Request;
}

function createResponse() {
  const response = {
    locals: {} as Partial<CurrentUserLocals>,
    status: vi.fn(),
    json: vi.fn(),
  };

  response.status.mockReturnValue(response);

  return response;
}

async function runMiddleware(devUserId?: string): Promise<{
  next: NextFunction;
  response: ReturnType<typeof createResponse>;
}> {
  const response = createResponse();
  const next = vi.fn() as NextFunction;

  await requireCurrentUser(
    createRequest(devUserId),
    response as unknown as Response<unknown, CurrentUserLocals>,
    next,
  );

  return { next, response };
}

describe("current user middleware", () => {
  beforeEach(() => {
    findUserById.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("rejects a missing development user header without querying users", async () => {
    const { next, response } = await runMiddleware();

    expect(findUserById).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      error: "A current user is required",
    });
  });

  test("rejects an unknown development user without continuing", async () => {
    findUserById.mockResolvedValue(null);

    const { next, response } = await runMiddleware(currentUser.id);

    expect(findUserById).toHaveBeenCalledWith(currentUser.id);
    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      error: "Invalid current user",
    });
  });

  test("attaches the verified user before continuing", async () => {
    findUserById.mockResolvedValue(currentUser);

    const { next, response } = await runMiddleware(currentUser.id);

    expect(response.locals.currentUser).toEqual(currentUser);
    expect(next).toHaveBeenCalledOnce();
  });

  test("does not expose user lookup failures", async () => {
    const error = new Error("database unavailable");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    findUserById.mockRejectedValue(error);

    const { next, response } = await runMiddleware(currentUser.id);

    expect(next).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to load current user:",
      error,
    );
    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      error: "Unable to authenticate current user",
    });
  });
});

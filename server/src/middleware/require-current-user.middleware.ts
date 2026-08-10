import type { CurrentUserLocals } from "../../../shared/types/user.ts";
import type { NextFunction, Request, Response } from "express";
import { findUserById } from "../models/user.model.ts";

export async function requireCurrentUser(
  request: Request,
  response: Response<unknown, CurrentUserLocals>,
  next: NextFunction,
): Promise<void> {
  const devUserId = request.header("X-Dev-User-Id");

  if (!devUserId) {
    response.status(401).json({ error: "A current user is required" });
    return;
  }

  try {
    const user = await findUserById(devUserId);

    if (!user) {
      response.status(401).json({ error: "Invalid current user" });
      return;
    }

    response.locals.currentUser = user;
    next();
  } catch (error) {
    console.error("Failed to load current user:", error);
    response.status(500).json({ error: "Unable to authenticate current user" });
  }
}

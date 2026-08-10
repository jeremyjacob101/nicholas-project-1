import { findAllUsers } from "../models/user.model.ts";
import type { Request, Response } from "express";

export async function listUsers(
  request: Request,
  response: Response,
): Promise<void> {
  try {
    const users = await findAllUsers();
    response.json({ users });
  } catch (error) {
    console.error("Failed to load users:", error);
    response.status(500).json({ error: "Unable to load users" });
  }
}

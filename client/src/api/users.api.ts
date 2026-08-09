import type { UserRecord } from "../../../shared/types/user";
import { apiFetch } from "./client";

export async function fetchUsers(): Promise<UserRecord[]> {
  const data = await apiFetch<{ users: UserRecord[] }>("/api/users");
  return data.users;
}

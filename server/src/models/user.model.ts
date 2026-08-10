import type { UserRecord } from "../../../shared/types/user.ts";
import { pool } from "../database.ts";

const userQuery = `
  SELECT
    users.id,
    users.name,
    users.email,
    companies.id AS company_id,
    companies.name AS company_name
  FROM users
  JOIN companies ON companies.id = users.company_id
`;

export async function findAllUsers(): Promise<UserRecord[]> {
  const result = await pool.query<UserRecord>(
    `${userQuery} ORDER BY companies.name, users.name`,
  );

  return result.rows;
}

export async function findUserById(userId: string): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    `${userQuery} WHERE users.id = $1`,
    [userId],
  );

  return result.rows[0] ?? null;
}

import type { UserRecord } from "../../../shared/types/user.js";
import { pool } from "../database.js";

export async function findAllUsers(): Promise<UserRecord[]> {
  const result = await pool.query<UserRecord>(`
    SELECT
      users.id,
      users.name,
      users.email,
      companies.id AS company_id,
      companies.name AS company_name
    FROM users
    JOIN companies ON companies.id = users.company_id
    ORDER BY companies.name, users.name
  `);

  return result.rows;
}

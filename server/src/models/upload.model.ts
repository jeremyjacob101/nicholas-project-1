import type {
  CreateUploadRecordInput,
  UploadRecord,
} from "../../../shared/types/upload.js";
import { pool } from "../database.js";

export async function createUpload(
  input: CreateUploadRecordInput,
): Promise<UploadRecord> {
  const result = await pool.query<UploadRecord>(
    `
      INSERT INTO uploads (
        id,
        sample_id,
        filename,
        safe_filename,
        classification,
        company_id,
        created_by_user_id,
        object_key,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'queued')
      RETURNING
        id,
        sample_id,
        filename,
        safe_filename,
        classification,
        company_id,
        created_by_user_id,
        object_key,
        status,
        created_at,
        updated_at
    `,
    [
      input.id,
      input.sample_id,
      input.filename,
      input.safe_filename,
      input.classification,
      input.company_id,
      input.created_by_user_id,
      input.object_key,
    ],
  );

  return result.rows[0];
}

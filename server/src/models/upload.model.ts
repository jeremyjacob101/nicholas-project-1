import type {
  AuthorizedUpload,
  CreateUploadRecordInput,
  UploadStatus,
  UploadRecord,
} from "../../../shared/types/upload.ts";
import { pool } from "../database.ts";

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

export async function updateUploadStatus(
  uploadId: string,
  status: UploadStatus,
): Promise<void> {
  await pool.query(
    `
      UPDATE uploads
      SET status = $2, updated_at = NOW()
      WHERE id = $1
    `,
    [uploadId, status],
  );
}

export async function findUploadRecordByIdAndCompanyId(
  uploadId: string,
  companyId: string,
): Promise<UploadRecord | null> {
  const result = await pool.query<UploadRecord>(
    `
      SELECT
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
      FROM uploads
      WHERE id = $1 AND company_id = $2
    `,
    [uploadId, companyId],
  );

  return result.rows[0] ?? null;
}

export async function findUploadsByCompanyId(
  companyId: string,
): Promise<AuthorizedUpload[]> {
  const result = await pool.query<AuthorizedUpload>(
    `
      SELECT
        id,
        sample_id,
        filename,
        classification,
        status,
        created_at
      FROM uploads
      WHERE company_id = $1
      ORDER BY created_at DESC
    `,
    [companyId],
  );

  return result.rows;
}

export async function findUploadByIdAndCompanyId(
  uploadId: string,
  companyId: string,
): Promise<AuthorizedUpload | null> {
  const result = await pool.query<AuthorizedUpload>(
    `
      SELECT
        id,
        sample_id,
        filename,
        classification,
        status,
        created_at
      FROM uploads
      WHERE id = $1 AND company_id = $2
    `,
    [uploadId, companyId],
  );

  return result.rows[0] ?? null;
}

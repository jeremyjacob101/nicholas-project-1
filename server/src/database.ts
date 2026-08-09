import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: "../.env" });

const { Pool } = pg;

export const pool = new Pool({
  host: "localhost",
  port: Number(process.env.POSTGRES_HOST_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

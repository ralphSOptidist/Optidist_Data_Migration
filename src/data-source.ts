import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

export const sourceDatabase = new DataSource({
  type: "postgres",
  host: process.env.FROM_DB_HOST,
  port: Number(process.env.FROM_DB_PORT),
  username: process.env.FROM_DB_USERNAME,
  password: process.env.FROM_DB_PASSWORD,
  database: process.env.FROM_DB_NAME,
  ssl:
    Number(process.env.FROM_DB_SSL) === 1
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
  synchronize: false,
});

export const targetDatabase = new DataSource({
  type: "postgres",
  host: process.env.TO_DB_HOST,
  port: Number(process.env.TO_DB_PORT),
  username: process.env.TO_DB_USERNAME,
  password: process.env.TO_DB_PASSWORD,
  database: process.env.TO_DB_NAME,
  ssl:
    Number(process.env.TO_DB_SSL) === 1
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
  synchronize: false,
});

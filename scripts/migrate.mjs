import { execSync } from "node:child_process";

const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!url) {
  console.error(
    "DATABASE_URL이 없습니다. Vercel Postgres(Neon)를 연결한 뒤 DATABASE_URL을 설정하세요.",
  );
  process.exit(1);
}

process.env.DATABASE_URL = url;
console.log("Applying database migrations...");
execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });

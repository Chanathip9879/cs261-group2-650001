// server/db/bootstrap.js
// เตรียมฐานข้อมูล MSSQL: สร้าง database ถ้ายังไม่มี, สร้างตาราง, และ seed ข้อมูลตั้งต้น
// ใช้ทั้งตอน start server (DB_AUTO_INIT=true) และสคริปต์ npm run db:init

const fs = require('fs');
const path = require('path');
const sql = require('mssql');

const { getMasterConfig, getDatabaseName, isValidDatabaseName } = require('./config');
const { getPool } = require('./mssqlRepository');
const { ensureSchema, seedDatabase } = require('./schema');

const SEED_PATH = path.join(__dirname, '../data/database.json');

async function createDatabaseIfMissing() {
  const databaseName = getDatabaseName();
  if (!isValidDatabaseName(databaseName)) {
    throw new Error(`ชื่อฐานข้อมูลไม่ถูกต้อง: "${databaseName}" (ใช้ได้เฉพาะ A-Z, 0-9 และ _)`);
  }

  const masterPool = await new sql.ConnectionPool(getMasterConfig()).connect();
  try {
    await masterPool.request().query(
      `IF DB_ID('${databaseName}') IS NULL CREATE DATABASE [${databaseName}]`
    );
  } finally {
    await masterPool.close();
  }
}

async function bootstrapMssql({ reset = false, seed = true } = {}) {
  await createDatabaseIfMissing();

  const pool = await getPool();
  await ensureSchema(pool);

  if (!seed) return null;

  const raw = fs.readFileSync(SEED_PATH, 'utf-8');
  const db = JSON.parse(raw);
  return seedDatabase(pool, db, { reset });
}

module.exports = { bootstrapMssql, createDatabaseIfMissing };

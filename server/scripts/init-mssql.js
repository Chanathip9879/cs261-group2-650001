// server/scripts/init-mssql.js
// สร้างฐานข้อมูล MSSQL + ตาราง + seed ข้อมูลจาก server/data/database.json
//
// วิธีใช้ (จากโฟลเดอร์รากของโปรเจกต์):
//   npm run db:init            # สร้างถ้ายังไม่มี / seed เมื่อตารางว่าง
//   npm run db:reset           # ล้างข้อมูลเดิมทั้งหมดแล้ว seed ใหม่
//   node server/scripts/init-mssql.js --no-seed   # สร้างเฉพาะตาราง

require('dotenv').config();

const { bootstrapMssql } = require('../db/bootstrap');
const { closePool } = require('../db/mssqlRepository');
const { getMssqlConfig, getDatabaseName } = require('../db/config');

const RETRY_ATTEMPTS = Number(process.env.DB_INIT_RETRIES || 15);
const RETRY_DELAY_MS = Number(process.env.DB_INIT_RETRY_DELAY_MS || 3000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDatabase(options) {
  let lastError;

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await bootstrapMssql(options);
    } catch (err) {
      lastError = err;
      console.warn(`[db:init] รอ SQL Server (${attempt}/${RETRY_ATTEMPTS}): ${err.message}`);
      if (attempt < RETRY_ATTEMPTS) await sleep(RETRY_DELAY_MS);
    }
  }

  throw lastError;
}

async function main() {
  const reset = process.argv.includes('--reset');
  const seed = !process.argv.includes('--no-seed');
  const config = getMssqlConfig();

  console.log('====================================================');
  console.log('  HiwKhaw - MSSQL Initialization');
  console.log(`  Server   : ${config.server}:${config.port}`);
  console.log(`  Database : ${getDatabaseName()}`);
  console.log(`  Mode     : ${reset ? 'RESET + SEED' : seed ? 'CREATE + SEED (ถ้าว่าง)' : 'SCHEMA ONLY'}`);
  console.log('====================================================');

  const result = await waitForDatabase({ reset, seed });

  if (result) {
    const { seeded, counts } = result;
    console.log(seeded ? '✅ seed ข้อมูลเรียบร้อย' : 'ℹ️  มีข้อมูลอยู่แล้ว ไม่ seed ซ้ำ');
    console.log(
      `   canteens=${counts.canteens}, categories=${counts.categories}, shops=${counts.shops}, ` +
      `admins=${counts.admins}, menu_items=${counts.menu_items}`
    );
  } else {
    console.log('✅ สร้างตารางเรียบร้อย (ไม่ได้ seed ข้อมูล)');
  }
}

main()
  .then(async () => {
    await closePool();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ ตั้งค่าฐานข้อมูลไม่สำเร็จ:', err.message);
    await closePool().catch(() => {});
    process.exit(1);
  });

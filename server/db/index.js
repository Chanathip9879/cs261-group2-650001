// server/db/index.js
// จุดเดียวที่ controller ใช้เข้าถึงฐานข้อมูล
// เลือก driver ด้วย environment variable DB_DRIVER = mssql (ค่าเริ่มต้น) หรือ json

const rawDriver = String(process.env.DB_DRIVER || 'mssql').toLowerCase();
const driver = ['mssql', 'json'].includes(rawDriver) ? rawDriver : 'mssql';

if (rawDriver !== driver) {
  console.warn(`[db] DB_DRIVER="${rawDriver}" ไม่รู้จัก ใช้ mssql แทน (รองรับ: mssql, json)`);
}

const repository = driver === 'json'
  ? require('./jsonRepository')
  : require('./mssqlRepository');

module.exports = repository;

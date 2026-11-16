// server/db/config.js
// ค่า config กลางสำหรับเชื่อมต่อ SQL Server (MSSQL)
// อ่านจาก environment variable เพื่อไม่ให้ข้อมูลลับอยู่ในโค้ด (ดู .env.example)

function toBool(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true' || String(value) === '1';
}

function getDatabaseName() {
  return process.env.DB_NAME || 'hiwkhaw';
}

// config สำหรับเชื่อมต่อฐานข้อมูลที่ใช้งานจริง
function getMssqlConfig() {
  const password = process.env.DB_PASSWORD;
  if (!password) {
    throw new Error(
      'ยังไม่ได้ตั้งค่า DB_PASSWORD — คัดลอก .env.example เป็น .env แล้วใส่รหัสผ่าน SQL Server'
    );
  }

  return {
    server: process.env.DB_SERVER || 'localhost',
    port: Number(process.env.DB_PORT || 1433),
    user: process.env.DB_USER || 'sa',
    password,
    database: getDatabaseName(),
    options: {
      encrypt: toBool(process.env.DB_ENCRYPT, false),
      trustServerCertificate: toBool(process.env.DB_TRUST_SERVER_CERT, true),
      enableArithAbort: true,
    },
    pool: {
      max: Number(process.env.DB_POOL_MAX || 10),
      min: 0,
      idleTimeoutMillis: 30000,
    },
    requestTimeout: Number(process.env.DB_REQUEST_TIMEOUT || 30000),
  };
}

// config สำหรับเชื่อมต่อ master (ใช้ตอน CREATE DATABASE)
function getMasterConfig() {
  return { ...getMssqlConfig(), database: 'master' };
}

// ชื่อฐานข้อมูลถูกนำไปต่อในคำสั่ง CREATE DATABASE จึงต้องตรวจให้ปลอดภัย
function isValidDatabaseName(name) {
  return /^[A-Za-z0-9_]+$/.test(name);
}

module.exports = {
  getMssqlConfig,
  getMasterConfig,
  getDatabaseName,
  isValidDatabaseName,
};

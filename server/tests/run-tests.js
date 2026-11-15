const assert = require('node:assert/strict');
const { resetStore, readShops } = require('../utils/dbAdapter');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

// สร้าง Token จำลองสำหรับทดสอบ Authorization
function createMockToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.mock-signature`;
}

const OWNER_GREEN_TOKEN = createMockToken({
  id: 'user-owner-green',
  role: 'OWNER',
  shop_id: 'shop-green-01'
});

const OWNER_SCI_TOKEN = createMockToken({
  id: 'user-owner-sci',
  role: 'OWNER',
  shop_id: 'shop-sci-01'
});

const CUSTOMER_TOKEN = createMockToken({
  id: 'user-student-01',
  role: 'CUSTOMER'
});

const results = [];

async function runCase(task, name, fn) {
  try {
    await fn();
    results.push({ task, name, status: 'PASS', detail: 'ผ่านตามเงื่อนไข' });
    console.log(`[PASS] ${task} | ${name}`);
  } catch (err) {
    results.push({ task, name, status: 'FAIL', detail: err.message });
    console.error(`[FAIL] ${task} | ${name} -> ${err.message}`);
  }
}

async function main() {
  console.log('==============================================================');
  console.log(' เริ่มทดสอบระบบ Backend (Task 35, Task 39, Task 50)');
  console.log(` Target Server: ${BASE_URL}`);
  console.log('==============================================================\n');

  // รีเซ็ตข้อมูลเริ่มต้นก่อนรันทดสอบทุกครั้ง
  resetStore();

  // --------------------------------------------------------------------------
  // TASK 35 (U8): ทดสอบการเรียงระยะทางและกรณีร้านไม่มีพิกัด
  // --------------------------------------------------------------------------
  // ร้านมาจาก database.json (ร้านจริง) จึงคำนวณผลที่คาดหวังจากข้อมูลจริงแทนการ fix รหัสร้าน
  const allShops = readShops();
  const hasCoords = (s) => Number.isFinite(s.latitude) && Number.isFinite(s.longitude);
  const expectedNearbyIds = allShops.filter((s) => s.is_open && hasCoords(s)).map((s) => s.id).sort();
  const closedIds = allShops.filter((s) => !s.is_open).map((s) => s.id);
  const noCoordIds = allShops.filter((s) => !hasCoords(s)).map((s) => s.id);
  const greenShop = allShops.find((s) => s.canteen === 'green' && s.is_open && hasCoords(s));
  const sciShop = allShops.find((s) => s.canteen === 'sci' && s.is_open && hasCoords(s));

  const assertSortedByDistance = (data) => {
    for (let i = 1; i < data.length; i += 1) {
      assert.ok(data[i - 1].distance_km <= data[i].distance_km);
    }
  };

  await runCase(
    'Task 35',
    '35.1 เรียงระยะทางถูกต้องจากตำแหน่ง Green Canteen (ร้านกรีนแคนทีนมาก่อน)',
    async () => {
      assert.ok(greenShop && sciShop, 'ต้องมีร้านเปิดที่มีพิกัดทั้งสองโรงอาหารใน database.json');
      const res = await fetch(
        `${BASE_URL}/api/shops/nearby?lat=${greenShop.latitude}&lng=${greenShop.longitude}`
      );
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.deepEqual(json.data.map((s) => s.id).sort(), expectedNearbyIds);
      assert.equal(json.data[0].canteen, 'green');
      assert.equal(json.data[json.data.length - 1].canteen, 'sci');
      assertSortedByDistance(json.data);
    }
  );

  await runCase(
    'Task 35',
    '35.2 เรียงระยะทางเปลี่ยนถูกต้องเมื่อย้ายไปตำแหน่ง SC Canteen (ร้านคณะวิทย์มาก่อน)',
    async () => {
      const res = await fetch(
        `${BASE_URL}/api/shops/nearby?lat=${sciShop.latitude}&lng=${sciShop.longitude}`
      );
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data[0].canteen, 'sci');
      assert.equal(json.data[json.data.length - 1].canteen, 'green');
      assertSortedByDistance(json.data);
    }
  );

  await runCase(
    'Task 35',
    '35.3 ร้านที่ปิดอยู่ (CLOSED) ไม่แสดงในผลลัพธ์',
    async () => {
      assert.ok(closedIds.length > 0, 'ต้องมีร้านที่ปิดอยู่อย่างน้อย 1 ร้านใน database.json');
      const res = await fetch(`${BASE_URL}/api/shops/nearby?lat=14.0736&lng=100.6014`);
      const json = await res.json();
      const hasClosedShop = json.data.some((s) => closedIds.includes(s.id) || s.status === 'CLOSED');
      assert.equal(hasClosedShop, false);
    }
  );

  await runCase(
    'Task 35',
    '35.4 ร้านที่ไม่มีพิกัด (null) ถูกข้ามอย่างปลอดภัยโดยระบบไม่ล่ม',
    async () => {
      assert.ok(noCoordIds.length > 0, 'ต้องมีร้านที่ไม่มีพิกัดอย่างน้อย 1 ร้านใน database.json');
      const res = await fetch(`${BASE_URL}/api/shops/nearby?lat=14.0736&lng=100.6014`);
      assert.equal(res.status, 200);
      const json = await res.json();
      const hasNullCoordShop = json.data.some((s) => noCoordIds.includes(s.id));
      assert.equal(hasNullCoordShop, false);
      assert.equal(json.data.some((s) => 'pin' in s), false);
    }
  );

  await runCase(
    'Task 35',
    '35.5 ส่งพิกัดผิดรูปแบบ (lat=abc / lat=999) หรือไม่ส่งพิกัด คืนค่า 400 Bad Request',
    async () => {
      const resMissing = await fetch(`${BASE_URL}/api/shops/nearby`);
      assert.equal(resMissing.status, 400);

      const resNaN = await fetch(`${BASE_URL}/api/shops/nearby?lat=abc&lng=100.6`);
      assert.equal(resNaN.status, 400);

      const resOutRange = await fetch(`${BASE_URL}/api/shops/nearby?lat=999&lng=100.6`);
      assert.equal(resOutRange.status, 400);
    }
  );

  // --------------------------------------------------------------------------
  // TASK 39 (U9): ทดสอบ validation และการแสดงผลรีวิว
  // --------------------------------------------------------------------------
  await runCase(
    'Task 39',
    '39.1 ส่งรีวิวที่ถูกต้องสำเร็จ (201) และดึงกลับมาแสดงตรงกับที่บันทึก',
    async () => {
      const payload = {
        username: 'Nuttakorn_Test',
        rating: 5,
        comment: 'น้ำซุปเข้มข้นมาก เส้นเหนียวนุ่ม ให้เยอะสมราคาครับ'
      };
      const postRes = await fetch(`${BASE_URL}/api/shops/shop-sci-01/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      assert.equal(postRes.status, 201);

      const getRes = await fetch(`${BASE_URL}/api/shops/shop-sci-01/reviews`);
      assert.equal(getRes.status, 200);
      const getJson = await getRes.json();
      assert.equal(getJson.data[0].username, payload.username);
      assert.equal(getJson.data[0].comment, payload.comment);
    }
  );

  await runCase(
    'Task 39',
    '39.2 ส่งข้อมูลผิดพลาด (ข้อความว่าง / สั้นกว่า 10 ตัวอักษร / ไม่กรอกชื่อ) คืนค่า 400',
    async () => {
      const resEmpty = await fetch(`${BASE_URL}/api/shops/shop-sci-01/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'Tester01', comment: '   ' })
      });
      assert.equal(resEmpty.status, 400);

      const resShort = await fetch(`${BASE_URL}/api/shops/shop-sci-01/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'Tester01', comment: 'อร่อยดี' })
      });
      assert.equal(resShort.status, 400);

      const resNoUser = await fetch(`${BASE_URL}/api/shops/shop-sci-01/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: '', comment: 'อร่อยมากๆ แนะนำเลยครับร้านนี้' })
      });
      assert.equal(resNoUser.status, 400);
    }
  );

  await runCase(
    'Task 39',
    '39.3 ระบบกันสแปมทำงานเมื่อส่งรีวิวถี่เกินไปในร้านเดิม (คืนค่า 429)',
    async () => {
      const resSpam = await fetch(`${BASE_URL}/api/shops/shop-sci-01/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'Nuttakorn_Test',
          rating: 4,
          comment: 'ลองกดส่งรีวิวซ้ำทันทีเพื่อทดสอบระบบป้องกันสแปม'
        })
      });
      assert.equal(resSpam.status, 429);
    }
  );

  // --------------------------------------------------------------------------
  // TASK 50 (U13): ทดสอบสิทธิ์และความถูกต้องของข้อมูลเวลาเปิด/ปิด
  // --------------------------------------------------------------------------
  await runCase(
    'Task 50',
    '50.1 บัญชีเจ้าของร้าน (OWNER) ตั้งเวลาเปิด/ปิดและวันหยุดพิเศษสำเร็จ (200)',
    async () => {
      const payload = {
        weekly: [
          { day_of_week: 0, is_closed: true },
          { day_of_week: 1, is_closed: false, open_time: '07:30', close_time: '20:00' },
          { day_of_week: 2, is_closed: false, open_time: '07:30', close_time: '20:00' },
          { day_of_week: 3, is_closed: false, open_time: '07:30', close_time: '20:00' },
          { day_of_week: 4, is_closed: false, open_time: '07:30', close_time: '20:00' },
          { day_of_week: 5, is_closed: false, open_time: '07:30', close_time: '20:00' },
          { day_of_week: 6, is_closed: false, open_time: '08:30', close_time: '18:00' }
        ],
        special_holidays: [
          { date: '2026-12-31', is_closed: true, note: 'หยุดวันสิ้นปี' }
        ]
      };

      const putRes = await fetch(`${BASE_URL}/api/shops/shop-green-01/opening-hours`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OWNER_GREEN_TOKEN}`
        },
        body: JSON.stringify(payload)
      });
      assert.equal(putRes.status, 200);

      const getRes = await fetch(`${BASE_URL}/api/shops/shop-green-01/opening-hours`);
      const getJson = await getRes.json();
      assert.equal(getJson.data.weekly[1].open_time, '07:30');
      assert.equal(getJson.data.special_holidays[0].date, '2026-12-31');
    }
  );

  await runCase(
    'Task 50',
    '50.2 ป้องกันสิทธิ์: ไม่ล็อกอิน (401) / ผู้ใช้ทั่วไปหรือเจ้าของร้านอื่น (403)',
    async () => {
      const validBody = JSON.stringify({
        weekly: [{ day_of_week: 1, is_closed: false, open_time: '09:00', close_time: '17:00' }]
      });

      const resNoAuth = await fetch(`${BASE_URL}/api/shops/shop-green-01/opening-hours`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: validBody
      });
      assert.equal(resNoAuth.status, 401);

      const resCustomer = await fetch(`${BASE_URL}/api/shops/shop-green-01/opening-hours`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${CUSTOMER_TOKEN}`
        },
        body: validBody
      });
      assert.equal(resCustomer.status, 403);

      const resOtherOwner = await fetch(`${BASE_URL}/api/shops/shop-green-01/opening-hours`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OWNER_SCI_TOKEN}`
        },
        body: validBody
      });
      assert.equal(resOtherOwner.status, 403);
    }
  );

  await runCase(
    'Task 50',
    '50.3 ส่งรูปแบบเวลาผิดพลาด (25:99) หรือเวลาปิดก่อนเวลาเปิด คืนค่า 400 Bad Request',
    async () => {
      const resBadFormat = await fetch(`${BASE_URL}/api/shops/shop-green-01/opening-hours`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OWNER_GREEN_TOKEN}`
        },
        body: JSON.stringify({
          weekly: [{ day_of_week: 1, is_closed: false, open_time: '25:99', close_time: '18:00' }]
        })
      });
      assert.equal(resBadFormat.status, 400);

      const resBadRange = await fetch(`${BASE_URL}/api/shops/shop-green-01/opening-hours`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OWNER_GREEN_TOKEN}`
        },
        body: JSON.stringify({
          weekly: [{ day_of_week: 1, is_closed: false, open_time: '19:00', close_time: '08:00' }]
        })
      });
      assert.equal(resBadRange.status, 400);
    }
  );

  console.log('\n==============================================================');
  console.log(' สรุปผลการทดสอบ (สามารถก็อปปี้ไปบันทึกใน Trello ได้ทันที)');
  console.log('==============================================================');
  console.table(results);

  const failedCount = results.filter((r) => r.status === 'FAIL').length;
  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('เกิดข้อผิดพลาดขณะรันทดสอบ:', err);
  process.exit(1);
});
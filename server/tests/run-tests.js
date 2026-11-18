const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('node:child_process');
const { resetStore, readShops } = require('../utils/dbAdapter');
const db = require('../db');
const lockout = require('../utils/loginLockout');
const { bangkokParts, getEffectiveStatus } = require('../utils/effectiveHours');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

// U7: เบอร์สมมติสำหรับเทสต์ lockout — ใช้ 0800 นำหน้าเพื่อไม่ให้ชนกับเบอร์ร้านเดโม
// (0811111111 / 0822222222 / 0833333333 / 0844444444 / แอดมิน 0899999999)
const DEMO_PHONES = new Set(['0811111111', '0822222222', '0833333333', '0844444444', '0899999999']);
const fakePhoneBase = Date.now() % 900000;
let fakePhoneSeq = 0;
function uniqueFakePhone() {
  let phone;
  do {
    fakePhoneSeq += 1;
    phone = `0800${String((fakePhoneBase + fakePhoneSeq) % 1000000).padStart(6, '0')}`;
  } while (DEMO_PHONES.has(phone));
  return phone;
}

function postLogin(body) {
  return fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

// Token จำลองที่ไม่ได้มาจากการ Login จริง — ต้องถูกปฏิเสธเสมอ
function createForgedToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.mock-signature`;
}

const FORGED_OWNER_TOKEN = createForgedToken({
  id: 'user-owner-green',
  role: 'OWNER',
  shop_id: 'shop-test-01'
});

// Login จริงผ่าน POST /api/auth/login ด้วยเบอร์โทร + PIN ของร้านใน database.json
function readShopCredentials(shopId) {
  const db = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'data', 'database.json'), 'utf8')
  );
  const shop = db.shops.find((s) => s.id === shopId);
  return { phone: shop.phone, pin: shop.pin };
}

async function loginAsShop(shopId) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(readShopCredentials(shopId))
  });
  const json = await res.json();
  assert.equal(res.status, 200, `Login ร้าน ${shopId} ไม่สำเร็จ`);
  assert.equal(json.user.shopId, shopId);
  return json.token;
}

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

  // รีเซ็ตข้อมูลเริ่มต้นก่อนรันทดสอบทุกครั้ง (ผ่าน DB ไม่ใช่ไฟล์ store)
  await resetStore();

  const OWNER_GREEN_TOKEN = await loginAsShop('shop-test-01');
  const OWNER_SCI_TOKEN = await loginAsShop('shop-test-03');
  // ร้านที่มีเฉพาะใน database.json (ไม่เคยอยู่ในร้านทดสอบ 5 ร้านเดิม)
  const OWNER_GREEN2_TOKEN = await loginAsShop('shop-test-02');

  // --------------------------------------------------------------------------
  // SEED HOURS: เวลาเปิด-ปิดตั้งต้นที่ seed จาก database.json
  // ต้องรันก่อน Task 50 / ES เพราะเทสต์เหล่านั้นแก้เวลาและไม่คืนค่าเดิม
  // --------------------------------------------------------------------------
  await runCase(
    'Seed hours',
    'SH.1 ร้านเดโม 01-03 เปิด 08:00-21:00 ทุกวัน และร้านกรีนแคนทีนเปิดเสาร์-อาทิตย์เวลาเท่าปกติ',
    async () => {
      for (const shopId of ['shop-test-01', 'shop-test-02', 'shop-test-03']) {
        const res = await fetch(`${BASE_URL}/api/shops/${shopId}/opening-hours`);
        assert.equal(res.status, 200);
        const json = await res.json();
        assert.equal(json.data.weekly.length, 7, `${shopId} ต้องมีตารางครบ 7 วัน`);
        for (const day of json.data.weekly) {
          assert.equal(day.is_closed, false, `${shopId} วัน ${day.day_of_week} ต้องเปิด`);
          assert.equal(day.open_time, '08:00');
          assert.equal(day.close_time, '21:00');
        }
      }

      // shop-test-01 ยังคงมีวันหยุดพิเศษตัวอย่าง (5 ธ.ค.)
      const test01 = await (await fetch(`${BASE_URL}/api/shops/shop-test-01/opening-hours`)).json();
      assert.ok(
        test01.data.special_holidays.some((h) => h.date === '2026-12-05'),
        'shop-test-01 ต้องมีวันหยุดพิเศษ hol-init-001'
      );

      // ร้านกรีนแคนทีน: เปิดทุกวัน (รวมเสาร์-อาทิตย์) เวลาเท่ากับวันปกติ
      const green = await (await fetch(`${BASE_URL}/api/shops/shop-green-01/opening-hours`)).json();
      assert.equal(green.data.weekly.length, 7);
      for (const day of green.data.weekly) {
        assert.equal(day.is_closed, false, `กรีนแคนทีน วัน ${day.day_of_week} ต้องเปิด`);
        assert.equal(day.open_time, '07:00');
        assert.equal(day.close_time, '17:00');
      }
    }
  );

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
    '35.2 เรียงระยะทางเปลี่ยนถูกต้องเมื่อย้ายไปตำแหน่ง SCI Canteen (ร้านคณะวิทย์มาก่อน)',
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
      const postRes = await fetch(`${BASE_URL}/api/shops/shop-test-03/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      assert.equal(postRes.status, 201);

      const getRes = await fetch(`${BASE_URL}/api/shops/shop-test-03/reviews`);
      assert.equal(getRes.status, 200);
      const getJson = await getRes.json();
      assert.equal(getJson.data[0].username, payload.username);
      assert.equal(getJson.data[0].comment, payload.comment);
    }
  );

  await runCase(
    'Task 39',
    '39.4 รีวิวได้ทุกร้านใน database.json (201) / ร้านที่ไม่มีจริงคืนค่า 404',
    async () => {
      // ใช้ IP ต่างกันต่อร้าน เพื่อไม่ให้ชน rate limit (5 รีวิว / 10 นาที ต่อ IP)
      for (const [index, shop] of allShops.entries()) {
        const getRes = await fetch(`${BASE_URL}/api/shops/${shop.id}/reviews`);
        assert.equal(getRes.status, 200, `GET รีวิวร้าน ${shop.id}`);

        const postRes = await fetch(`${BASE_URL}/api/shops/${shop.id}/reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': `10.39.4.${index + 1}`
          },
          body: JSON.stringify({
            username: `AllShops_${shop.id}`,
            rating: 4,
            comment: `ทดสอบรีวิวร้าน ${shop.id} จากรายชื่อร้านจริง`
          })
        });
        assert.equal(postRes.status, 201, `POST รีวิวร้าน ${shop.id}`);
      }

      const resUnknown = await fetch(`${BASE_URL}/api/shops/shop-inter-01/reviews`);
      assert.equal(resUnknown.status, 404);
    }
  );

  await runCase(
    'Task 39',
    '39.5 response ของ GET /reviews (ทั้งสองรูปแบบ) ไม่มี client_ip',
    async () => {
      for (const url of ['/api/shops/shop-test-01/reviews', '/api/reviews?shop_id=shop-test-01']) {
        const res = await fetch(`${BASE_URL}${url}`);
        assert.equal(res.status, 200);
        const json = await res.json();
        assert.ok(json.data.length > 0);
        assert.equal(json.data.some((r) => 'client_ip' in r), false);
      }
    }
  );

  await runCase(
    'Task 39',
    '39.2 ส่งข้อมูลผิดพลาด (ข้อความว่าง / สั้นกว่า 10 ตัวอักษร / ไม่กรอกชื่อ) คืนค่า 400',
    async () => {
      const resEmpty = await fetch(`${BASE_URL}/api/shops/shop-test-03/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'Tester01', comment: '   ' })
      });
      assert.equal(resEmpty.status, 400);

      const resShort = await fetch(`${BASE_URL}/api/shops/shop-test-03/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'Tester01', comment: 'อร่อยดี' })
      });
      assert.equal(resShort.status, 400);

      const resNoUser = await fetch(`${BASE_URL}/api/shops/shop-test-03/reviews`, {
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
      const resSpam = await fetch(`${BASE_URL}/api/shops/shop-test-03/reviews`, {
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
    '50.1 เจ้าของร้าน Login จริงแล้วตั้งเวลาเปิด/ปิดและวันหยุดพิเศษสำเร็จ (200)',
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

      const putRes = await fetch(`${BASE_URL}/api/shops/shop-test-01/opening-hours`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OWNER_GREEN_TOKEN}`
        },
        body: JSON.stringify(payload)
      });
      assert.equal(putRes.status, 200);

      const getRes = await fetch(`${BASE_URL}/api/shops/shop-test-01/opening-hours`);
      const getJson = await getRes.json();
      assert.equal(getJson.data.weekly[1].open_time, '07:30');
      assert.equal(getJson.data.special_holidays[0].date, '2026-12-31');
    }
  );

  await runCase(
    'Task 50',
    '50.2 ป้องกันสิทธิ์: ไม่ล็อกอิน (401) / Token ปลอมหรือเจ้าของร้านอื่น (403)',
    async () => {
      const validBody = JSON.stringify({
        weekly: [{ day_of_week: 1, is_closed: false, open_time: '09:00', close_time: '17:00' }]
      });

      const resNoAuth = await fetch(`${BASE_URL}/api/shops/shop-test-01/opening-hours`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: validBody
      });
      assert.equal(resNoAuth.status, 401);

      const resForged = await fetch(`${BASE_URL}/api/shops/shop-test-01/opening-hours`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${FORGED_OWNER_TOKEN}`
        },
        body: validBody
      });
      assert.equal(resForged.status, 403);

      const resOtherOwner = await fetch(`${BASE_URL}/api/shops/shop-test-01/opening-hours`, {
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
    '50.4 ร้านจริงที่ไม่ได้อยู่ในร้านทดสอบเดิม ดูและบันทึกเวลาเปิด/ปิดได้ (200)',
    async () => {
      const getRes = await fetch(`${BASE_URL}/api/shops/shop-test-02/opening-hours`);
      assert.equal(getRes.status, 200);

      const putRes = await fetch(`${BASE_URL}/api/shops/shop-test-02/opening-hours`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OWNER_GREEN2_TOKEN}`
        },
        body: JSON.stringify({
          weekly: [{ day_of_week: 1, is_closed: false, open_time: '10:00', close_time: '16:00' }]
        })
      });
      assert.equal(putRes.status, 200);

      const afterRes = await fetch(`${BASE_URL}/api/shops/shop-test-02/opening-hours`);
      const afterJson = await afterRes.json();
      const monday = afterJson.data.weekly.find((d) => d.day_of_week === 1);
      assert.equal(monday.open_time, '10:00');
    }
  );

  await runCase(
    'Task 50',
    '50.3 ส่งรูปแบบเวลาผิดพลาด (25:99) หรือเวลาปิดก่อนเวลาเปิด คืนค่า 400 Bad Request',
    async () => {
      const resBadFormat = await fetch(`${BASE_URL}/api/shops/shop-test-01/opening-hours`, {
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

      const resBadRange = await fetch(`${BASE_URL}/api/shops/shop-test-01/opening-hours`, {
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

  // --------------------------------------------------------------------------
  // EFFECTIVE STATUS: vendor switch + today's hours (Asia/Bangkok)
  // --------------------------------------------------------------------------
  await runCase(
    'Effective status',
    'ES.1 fixed-time getEffectiveStatus covers within/outside/vendor/holiday/no-schedule',
    async () => {
      const row = { day_of_week: 2, is_closed: false, open_time: '10:00', close_time: '18:00' };
      const baseShop = { isOpen: true, openingHours: '08:00 - 17:00' };
      const within = new Date('2026-11-17T04:00:00Z'); // 11:00 Bangkok
      const outside = new Date('2026-11-17T12:00:00Z'); // 19:00 Bangkok

      const insideResult = getEffectiveStatus(baseShop, [row], [], within);
      assert.equal(insideResult.open, true);
      assert.equal(insideResult.todayText, '10:00 - 18:00 น.');
      assert.equal(insideResult.reason, 'within_hours');

      const outsideResult = getEffectiveStatus(baseShop, [row], [], outside);
      assert.equal(outsideResult.open, false);
      assert.equal(outsideResult.reason, 'outside_hours');

      const vendorClosed = getEffectiveStatus({ ...baseShop, isOpen: false }, [row], [], within);
      assert.equal(vendorClosed.open, false);
      assert.equal(vendorClosed.reason, 'vendor_closed');

      const holiday = getEffectiveStatus(baseShop, [row], [
        { date: '2026-11-17', is_closed: true, note: 'หยุดพิเศษ' }
      ], within);
      assert.equal(holiday.open, false);
      assert.equal(holiday.reason, 'holiday');

      const noSchedule = getEffectiveStatus(baseShop, [], [], within);
      assert.equal(noSchedule.open, true);
      assert.equal(noSchedule.reason, 'no_schedule');
      assert.equal(noSchedule.todayText, '08:00 - 17:00');
    }
  );

  const parts = bangkokParts(); // ใช้กับ listTodayHours เท่านั้น (ทุกวันตั้งค่าเหมือนกัน ผลจึงไม่ขึ้นกับวันจริง)

  // ตั้งเวลาทุกวัน (จันทร์-อาทิตย์) ให้เหมือนกัน เพื่อให้ผล effective status
  // ไม่ขึ้นกับวัน/เวลาจริงที่รันเทสต์
  const weekAllDays = (row) => [0, 1, 2, 3, 4, 5, 6].map((d) => ({ day_of_week: d, ...row }));

  const setHours = async (shopId, token, row) => {
    const res = await fetch(`${BASE_URL}/api/shops/${shopId}/opening-hours`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ weekly: weekAllDays(row), special_holidays: [] })
    });
    assert.equal(res.status, 200, `PUT opening-hours ${shopId}`);
  };

  await setHours('shop-test-01', OWNER_GREEN_TOKEN, { is_closed: true });
  await setHours('shop-test-02', OWNER_GREEN2_TOKEN, { is_closed: false, open_time: '00:00', close_time: '23:59' });
  await setHours('shop-test-03', OWNER_SCI_TOKEN, { is_closed: false, open_time: '00:00', close_time: '23:59' });

  await runCase(
    'Effective status',
    'ES.2 listTodayHours returns grouped rows for all shops in one call',
    async () => {
      const grouped = await db.listTodayHours(parts);
      assert.ok(grouped['shop-test-01'], 'shop-test-01 must have today hours');
      assert.equal(grouped['shop-test-01'].weekly[0].is_closed, true);
      assert.ok(grouped['shop-test-02'].weekly.some((r) => r.open_time === '00:00'));
    }
  );

  await runCase(
    'Effective status',
    'ES.3 GET /shops attaches effective status from today weekly rows',
    async () => {
      const res = await fetch(`${BASE_URL}/api/shops`);
      assert.equal(res.status, 200);
      const json = await res.json();
      const byId = Object.fromEntries(json.data.map((s) => [s.id, s]));

      const s1 = byId['shop-test-01'];
      assert.equal(s1.isOpen, true);
      assert.equal(s1.effectiveOpen, false);
      assert.equal(s1.effectiveStatus.open, false);
      assert.equal(s1.effectiveStatus.reason, 'closed_today');
      assert.equal(s1.effectiveStatus.todayText, 'ปิดทำการวันนี้');
      assert.equal(s1.todayHours[0].is_closed, true);

      const s2 = byId['shop-test-02'];
      assert.equal(s2.effectiveOpen, true);
      assert.equal(s2.effectiveStatus.reason, 'within_hours');
      assert.equal(s2.effectiveStatus.todayText, '00:00 - 23:59 น.');

      const s4 = byId['shop-test-04'];
      assert.equal(s4.isOpen, false);
      assert.equal(s4.effectiveOpen, false);
      assert.equal(s4.effectiveStatus.reason, 'vendor_closed');
    }
  );

  await runCase(
    'Effective status',
    'ES.4 open filter and sorting use effective status',
    async () => {
      const allRes = await fetch(`${BASE_URL}/api/shops`);
      const allJson = await allRes.json();
      const openRes = await fetch(`${BASE_URL}/api/shops?status=open`);
      const openJson = await openRes.json();

      const allOpenIds = allJson.data.filter((s) => s.effectiveOpen).map((s) => s.id).sort();
      assert.deepEqual(openJson.data.map((s) => s.id).sort(), allOpenIds);
      assert.equal(openJson.data.some((s) => s.id === 'shop-test-01'), false);
      assert.equal(openJson.data.some((s) => s.id === 'shop-test-04'), false);

      const firstClosed = allJson.data.findIndex((s) => !s.effectiveOpen);
      const lastOpen = allJson.data.findLastIndex((s) => s.effectiveOpen);
      assert.ok(firstClosed === -1 || lastOpen === -1 || lastOpen < firstClosed);

      assert.equal(allJson.meta.openCount, allOpenIds.length);
      assert.equal(allJson.meta.closedCount, allJson.meta.total - allOpenIds.length);
    }
  );

  // --------------------------------------------------------------------------
  // U7 (Task 30): ล็อกบัญชีชั่วคราวเมื่อกรอก PIN ผิด (docs/API_LOGIN_LOCKOUT.md)
  // --------------------------------------------------------------------------
  await runCase(
    'U7',
    'U7.0 loginLockout (logic): ผิด 4 ครั้งยังไม่ล็อก / ครั้งที่ 5 ล็อก 5 นาที / หมดเวลาเริ่มนับใหม่ / login สำเร็จ reset',
    async () => {
      const phone = '080-000-0001'; // ใช้รูปแบบมีขีด เพื่อทดสอบการ normalize
      const t0 = Date.parse('2026-11-18T10:00:00.000Z');
      const lockMs = 5 * 60 * 1000;

      // ยังไม่เคยผิด -> ไม่ล็อก
      assert.equal(lockout.getLock(phone, t0), null);

      // ผิด 4 ครั้ง -> ยังไม่ล็อก
      for (let i = 0; i < 4; i += 1) {
        const r = lockout.recordFailure(phone, t0 + i * 1000);
        assert.equal(r.locked, false, `ครั้งที่ ${i + 1} ต้องยังไม่ล็อก`);
        assert.equal(lockout.getLock(phone, t0 + i * 1000), null);
      }

      // ครั้งที่ 5 -> ล็อก 5 นาที
      const fifth = lockout.recordFailure(phone, t0 + 4000);
      assert.equal(fifth.locked, true);
      const lock = lockout.getLock(phone, t0 + 4000);
      assert.ok(lock, 'ต้องล็อกอยู่');
      assert.equal(lock.lockedUntil, t0 + 4000 + lockMs);
      assert.equal(lock.retryAfterMs, lockMs);

      // ระหว่างล็อกยังคงล็อกอยู่ แต่เบอร์อื่นไม่ถูกล็อก
      assert.ok(lockout.getLock(phone, t0 + 4000 + lockMs - 1));
      assert.equal(lockout.getLock('0800000002', t0 + 4000), null);

      // ผ่านไป 5 นาที -> ปลดอัตโนมัติและเริ่มนับใหม่
      const afterLock = t0 + 4000 + lockMs;
      assert.equal(lockout.getLock(phone, afterLock), null);
      for (let i = 0; i < 4; i += 1) {
        const r = lockout.recordFailure(phone, afterLock + i);
        assert.equal(r.locked, false, 'หลังปลดล็อกต้องเริ่มนับใหม่');
      }

      // login สำเร็จ -> reset (ถ้าไม่ reset ครั้งถัดไปจะครบ 5 แล้วถูกล็อก)
      lockout.reset(phone);
      for (let i = 0; i < 4; i += 1) {
        const r = lockout.recordFailure(phone, afterLock + 1000 + i);
        assert.equal(r.locked, false, 'หลัง reset ต้องเริ่มนับใหม่');
      }
    }
  );

  await runCase(
    'U7',
    'U7.1 loginLockout (logic): อ่านค่า MAX_ATTEMPTS / LOCK_SECONDS จาก env ได้',
    async () => {
      const modulePath = path.join(__dirname, '..', 'utils', 'loginLockout.js');
      const script = [
        `const l = require(${JSON.stringify(modulePath)});`,
        'let r;',
        "for (let i = 0; i < 3; i += 1) r = l.recordFailure('0800000009', 1000 + i);",
        "const lock = l.getLock('0800000009', 1002);",
        'process.stdout.write(JSON.stringify({ locked: r.locked, max: l.MAX_ATTEMPTS, retryAfterMs: lock && lock.retryAfterMs }));'
      ].join('\n');
      const out = execFileSync(process.execPath, ['-e', script], {
        env: { ...process.env, LOGIN_MAX_ATTEMPTS: '3', LOGIN_LOCK_SECONDS: '10' },
        encoding: 'utf8'
      });
      const parsed = JSON.parse(out);
      assert.equal(parsed.max, 3);
      assert.equal(parsed.locked, true);
      assert.equal(parsed.retryAfterMs, 10000);
    }
  );

  await runCase(
    'U7',
    'U7.2 API: PIN ผิด 4 ครั้งตอบ 401 ข้อความกลาง / ครั้งที่ 5 ตอบ 423 พร้อม retryAfterSeconds, lockedUntil และ Retry-After',
    async () => {
      const phone = uniqueFakePhone();
      for (let i = 0; i < 4; i += 1) {
        const res = await postLogin({ phone, pin: '0000' });
        assert.equal(res.status, 401, `ครั้งที่ ${i + 1} ต้องได้ 401`);
        const json = await res.json();
        assert.equal(json.success, false);
        assert.equal(json.locked, undefined);
        assert.equal(json.retryAfterSeconds, undefined);
        assert.equal(json.message, 'เบอร์โทรศัพท์หรือรหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      }

      const res = await postLogin({ phone, pin: '0000' });
      assert.equal(res.status, 423);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.locked, true);
      assert.equal(json.message, 'บัญชีถูกล็อกชั่วคราว');
      assert.ok(Number.isInteger(json.retryAfterSeconds) && json.retryAfterSeconds > 0);
      assert.ok(json.retryAfterSeconds <= 300);
      assert.equal(Number(res.headers.get('Retry-After')), json.retryAfterSeconds);
      const until = Date.parse(json.lockedUntil);
      assert.ok(Number.isFinite(until) && until > Date.now());
    }
  );

  await runCase(
    'U7',
    'U7.3 API: เบอร์ที่ถูกล็อกตอบ 423 ทันทีแม้เปลี่ยน PIN และไม่กระทบเบอร์อื่น',
    async () => {
      const phone = uniqueFakePhone();
      for (let i = 0; i < 5; i += 1) await postLogin({ phone, pin: '0000' });

      const res = await postLogin({ phone, pin: '9999' });
      assert.equal(res.status, 423);
      const json = await res.json();
      assert.equal(json.locked, true);

      const other = await postLogin({ phone: uniqueFakePhone(), pin: '0000' });
      assert.equal(other.status, 401);
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
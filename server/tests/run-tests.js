const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { resetStore, readShops } = require('../utils/dbAdapter');
const db = require('../db');
const { bangkokParts, getEffectiveStatus } = require('../utils/effectiveHours');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

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

  const parts = bangkokParts();
  const weekForToday = (todayRow) => [0, 1, 2, 3, 4, 5, 6].map((d) => (
    d === parts.dayOfWeek
      ? todayRow
      : { day_of_week: d, is_closed: false, open_time: '00:00', close_time: '23:59' }
  ));

  const setHours = async (shopId, token, todayRow) => {
    const res = await fetch(`${BASE_URL}/api/shops/${shopId}/opening-hours`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ weekly: weekForToday(todayRow), special_holidays: [] })
    });
    assert.equal(res.status, 200, `PUT opening-hours ${shopId}`);
  };

  await setHours('shop-test-01', OWNER_GREEN_TOKEN, {
    day_of_week: parts.dayOfWeek, is_closed: true
  });
  await setHours('shop-test-02', OWNER_GREEN2_TOKEN, {
    day_of_week: parts.dayOfWeek, is_closed: false, open_time: '00:00', close_time: '23:59'
  });
  await setHours('shop-test-03', OWNER_SCI_TOKEN, {
    day_of_week: parts.dayOfWeek, is_closed: false, open_time: '00:00', close_time: '23:59'
  });

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
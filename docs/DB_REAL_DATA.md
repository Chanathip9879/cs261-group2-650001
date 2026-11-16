# ข้อมูลร้านจริงใน `database.json` (นำเข้าครั้งแรก)

แทนร้านตัวอย่าง 10 ร้านด้วยร้านจริง 42 ร้าน (กรีนแคนทีน 33, โรงอาหารสังคมศาสตร์ `sc` 9) จากข้อมูลที่ทีมถ่ายภาพหน้าร้านและเมนู
อ่านภาพด้วย AI แล้วคลีนข้อมูล ยังไม่ได้ตรวจเทียบกับภาพครบทุกแถว **ข้อมูลที่นำเข้าคือร่างแรก ต้องตรวจและแก้ต่อ**

## กติกาการแปลง

| field | ค่าที่ใส่ |
|---|---|
| `id`, `name`, `canteen`, `category` | จากแบบฟอร์ม (หมวด "อื่น ๆ" ใช้ category ใหม่ `other`) |
| `phone`, `line_id`, `other_contact` | ใส่เฉพาะที่มีในข้อมูล ที่ไม่มีเป็น `null` (ตอนนี้ `phone` 8 ร้าน, `other_contact` 4 ร้าน) |
| `facebook`, `vendorName`, `pin` | `null` (ยังไม่มีข้อมูล) |
| `boothNumber`, `locationDetails` | `null` (ป้ายส่วนใหญ่ไม่ระบุ) |
| `openingHours` | `"ยังไม่ระบุเวลา"` (หน้าเว็บอ่านเป็นเวลาเริ่มต้นจนกว่าจะกรอกเวลาจริง) |
| `isOpen`, `statusNote` | `true` และข้อความ "ข้อมูลเริ่มต้น (ร้านยังไม่ได้อัปเดตสถานะ)" ร้านจริงอัปเดตเองภายหลัง |
| `latitude`, `longitude` | พิกัดของโรงอาหาร (ทุกร้านในโรงอาหารเดียวกันใช้ค่าเดียวกัน) |
| `rating`, `reviewCount` | `0` |
| เมนู (`menus`) | ชื่อ ราคา (ตัวเลข) `isAvailable: true` ถ้าป้ายมีหลายราคา ใช้ราคาต่ำสุดและเก็บช่วงเดิมไว้ใน `note` |

## เมนูที่ข้าม (ไม่มีราคาที่อ่านได้) 32 รายการ

- `shop-sc-05` ของทอดตามราคาป้าย
- `shop-green-03` ยกทั้งขา
- `shop-green-13` เครปกรอบหน้าสั่น (ไข่-น้ำพริกเผา-ปูอัด)
- `shop-green-13` เครปกรอบหน้าสั่น (นมข้น-กล้วย)
- `shop-green-13` เครปกรอบหน้าสั่น (บราวนี่-เยลลี่-เรนโบว์)
- `shop-green-17` เครื่องดื่มเพื่อสุขภาพ (แก้วเล็ก/แก้วใหญ่)
- `shop-green-18` ผลไม้ตามฤดูกาล
- `shop-green-23` ข้าวหมกไก่ทอด
- `shop-green-24` กะเพราไก่
- `shop-green-24` กะเพราหมู
- `shop-green-25` ราดหน้า
- `shop-green-28` Waffle PB (Original)
- `shop-green-28` Waffle PB (Almond)
- `shop-green-28` Waffle PB (Chocolate)
- `shop-green-28` Waffle PB (Pineapple)
- `shop-green-28` Waffle PB (Milk)
- `shop-green-28` Waffle PB (White Chocolate)
- `shop-green-28` Waffle PB (Strawberry)
- `shop-green-28` Waffle PB (Blueberry)
- `shop-green-28` Waffle PB (Banana)
- `shop-green-28` Waffle PB (Ham)
- `shop-green-28` Waffle PB (Cheese)
- `shop-green-28` Waffle PB (Sausage)
- `shop-green-28` Waffle PB (Nutella)
- `shop-green-32` ยำเสียบไม้รวมมิตร
- `shop-green-32` ยำหมูยอ
- `shop-green-32` ยำมาม่าซิกเนเจอร์
- `shop-green-32` ยำลูกชิ้นรวม
- `shop-green-32` ยำปูอัด
- `shop-green-33` หมูปิ้งนมสด
- `shop-green-33` ข้าวเหนียวหมูทอดเชียงราย
- `shop-green-33` ข้าวเหนียวหมูทอด

ร้านที่ไม่มีเมนูในระบบเลยเพราะทุกเมนูไม่มีราคา: `shop-green-28` ต้องกลับไปดูป้ายราคา

## ผลกระทบที่ต้องรู้

- โรงอาหาร `sci` (คณะวิทยาศาสตร์) ยังอยู่ใน `canteens` แต่ไม่มีร้านในข้อมูลชุดนี้
- รหัสร้านเดิม (`shop-green-01` ฯลฯ) ตอนนี้หมายถึงร้านจริงคนละร้านกับร้านตัวอย่างเดิม
- ร้านทุกร้านมี `pin` เป็น `null` ยังล็อกอินแม่ค้าไม่ได้ ปุ่ม demo login ในหน้าเว็บและชุดทดสอบ `server/tests/run-tests.js` (ล็อกอินเป็น `shop-green-01`, `shop-green-02`, `shop-sci-01`) จึงใช้ไม่ได้จนกว่าทีมจะตกลงวิธีทำบัญชีสาธิต
- ไฟล์ `sprint2_store.json` (รีวิวและเวลาเปิด-ปิด) ที่สร้างไว้แล้วในเครื่องเป็นข้อมูลของร้านตัวอย่างเดิม ควรลบแล้วให้ระบบสร้างใหม่

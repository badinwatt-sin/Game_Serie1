# Recruit Hub — Passive Candidate Sourcing Tool

เครื่องมือสำหรับทีม Recruiter ใช้ดึงดูดผู้สมัครตัวแทนใหม่ และติดตามจนเป็น Qualified Lead และ New Agent
พัฒนาต่อจากไอเดีย "Sourcing Management Tool – Candidate Journey" (Awareness → Interest → Consideration → Selection → Application)

มี 2 หน้า ใช้ฐานข้อมูลเดียวกัน

| หน้า | ผู้ใช้ | ไฟล์ |
|---|---|---|
| Landing | ผู้สนใจ (Visitor → Prospect) | `index.html` |
| Portal | Recruiting Admin และ Manager | `portal.html` |

## Flow และเครื่องมือในแต่ละขั้น

| ขั้น | เครื่องมือ | ผู้รับผิดชอบ | ตัวชี้วัด |
|---|---|---|---|
| **Awareness** | Portal › แคมเปญ & ลิงก์: ลิงก์ติดตามที่มา (`?s=ช่องทาง&c=แคมเปญ&ref=รหัสผู้จัดการ`), QR สำหรับสิ่งพิมพ์, ข้อความพร้อมโพสต์ | Recruiting + Manager | ยอดเข้าชมแยกช่องทาง |
| **Interest** | Landing: Why Insurance, 5 เหตุผล, Career Path, เครื่องคำนวณรายได้, Success Story, FAQ | Recruiting | อัตราเริ่มทำแบบประเมิน |
| **Consideration** | แบบประเมินตัวเอง 9 ข้อ (Attitude · Skill · Expectation) → ผลเป็นกราฟและเกรด A/B/C, ฟอร์มลงทะเบียน (แนวทางการขาย, Full/Part-time, จังหวัด, ความคาดหวัง, ความยินยอม PDPA), รหัสติดตามสถานะ | ผู้สมัคร | จำนวนลีด, เกรด |
| **Selection** | Portal › ลีด: Admin ประเมิน Qualified / ไม่ผ่าน, ระบบจัดอันดับผู้จัดการ, ส่งลีด, SLA อัตโนมัติ | Recruiting Admin | Qualified Lead, เวลาติดต่อครั้งแรก |
| **Application** | Portal › ลีดของฉัน: โทร/LINE, บันทึกการติดตาม, นัดสัมภาษณ์, แบบฟอร์มผลการพิจารณา → Admin อนุมัติเป็นตัวแทนใหม่ | Manager → Admin | อัตราติดต่อ, สัมภาษณ์, ตัวแทนใหม่ |

Portal › ภาพรวม แสดง Funnel ทั้งเส้น, ช่องทางที่สร้าง Qualified Lead, และผลงานผู้จัดการ

### กติกาการจับคู่และส่งลีด

- คะแนนจับคู่ 100 = พื้นที่ 40 (จังหวัดเดียวกัน 40 / ภาคเดียวกัน 20) + แนวทางการขายตรงกัน 25 + Rating 20 + ภาระงานที่ยังรับได้ 15
- เสนอเฉพาะผู้จัดการที่อยู่ในแคมเปญ ผลงานผ่านเงื่อนไข และลีดยังไม่เต็ม · ผู้ที่เป็นเจ้าของลิงก์แนะนำได้ลำดับแรก
- ผู้จัดการลำดับ 1 ไม่บันทึกการติดต่อใน 5 วัน → ส่งให้ลำดับ 2 เอง → ครบ 10 วัน ลีดกลับมาให้บริษัทติดต่อโดยตรง
- ปรับเกณฑ์ได้ที่ `js/logic.js` (`matchManagers`, `SLA_DAYS`, `QUEUE_SIZE`) และ `rc_sweep` ใน `supabase/recruit.sql`

## ทดลองใช้ (โหมดสาธิต)

ถ้า `config.js` ยังไม่ใส่ค่า Supabase แอปจะใช้ข้อมูลตัวอย่างที่เก็บในเบราว์เซอร์เครื่องนั้น

```bash
python3 -m http.server 8000      # รันที่ root ของ repo
# Landing:  http://localhost:8000/recruit/
# Portal:   http://localhost:8000/recruit/portal.html   (ADMIN หรือ M101 · รหัสผ่าน demo1234)
```

## เปิดใช้งานจริง

1. Supabase › SQL Editor: รัน `supabase/recruit.sql` ทั้งไฟล์
2. สร้างผู้ดูแลคนแรกด้วยคำสั่งท้ายไฟล์ (ตั้งรหัสผ่านเอง อย่าเก็บไว้ในไฟล์)
3. ใส่ `supabaseUrl` และ `supabaseKey` (publishable key) ใน `config.js` พร้อมชื่อบริษัท ช่องทางติดต่อ และลิงก์นโยบายความเป็นส่วนตัว
4. นำทั้ง repo ขึ้นโฮสต์ https (หน้า Portal ใช้ `../js/vendor/qrcode.js`)
5. เข้า Portal ด้วยบัญชีผู้ดูแล → เพิ่มผู้จัดการ → สร้างแคมเปญ → แจกลิงก์

## ความปลอดภัยของข้อมูลผู้สมัคร

- ทุกตารางเปิด RLS โดยไม่มี policy: key ที่อยู่ในหน้าเว็บอ่านหรือเขียนตารางตรง ๆ ไม่ได้
- ทุกอย่างผ่านฟังก์ชันใน `recruit.sql` ที่ตรวจ session token: Admin เห็นทั้งหมด, Manager เห็นเฉพาะลีดที่ตัวเองถืออยู่
- รหัสผ่านเก็บแบบ bcrypt, token เก็บเป็น hash อายุ 14 วัน
- ผู้สมัครตรวจสถานะได้ด้วยรหัสติดตาม + เบอร์ 4 ตัวท้าย และเห็นเพียงขั้นกับชื่อผู้จัดการ
- บันทึกเวลาให้ความยินยอมทุกราย (`consent_at`) · ตัวอย่างคำสั่งลบข้อมูลตามระยะเวลาเก็บรักษาอยู่ท้าย `recruit.sql`

## สิ่งที่ต้องทำเองก่อนเผยแพร่

- เนื้อหาใน `config.js` (5 เหตุผล, Success Story, อัตราค่าคอมมิชชัน) เป็นโครงตัวอย่าง ต้องแทนด้วยข้อเท็จจริงและผ่านการตรวจของ Compliance
- ระบบยังไม่ส่ง Email/SMS อัตโนมัติ: Admin กด "แจ้งผู้จัดการทาง SMS" ซึ่งเปิดแอป SMS ของเครื่องพร้อมข้อความ ถ้าต้องการส่งอัตโนมัติ ต่อ SMS gateway หรือ LINE OA ผ่าน Supabase Edge Function
- ยังไม่มีการอัปโหลดรูปผู้สมัคร และยังไม่เชื่อม Salesforce (ใช้ปุ่มส่งออก CSV แทนได้)

## โครงสร้าง

```
index.html  portal.html  config.js
css/app.css        design system
js/logic.js        ขั้นของลีด, แบบประเมิน, การจับคู่, จังหวัด
js/api.js          ชั้นข้อมูล: Supabase หรือโหมดสาธิต
js/landing.js      หน้า Landing ของผู้สมัคร
js/portal.js       Portal: ภาพรวม, ลีด, แคมเปญ & ลิงก์, ผู้จัดการ, Flow
supabase/recruit.sql
```

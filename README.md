# ระบบจัดการโครงการกองทุนฟื้นฟูและพัฒนาเกษตรกร

## ภาพรวมระบบ

ระบบสำหรับจัดการโครงการของกลุ่มเกษตรกรที่มีปัญหาหนี้สิน โดยมีกระบวนการอนุมัติแบบหลายขั้นตอน

### คุณสมบัติหลัก

1. **การจัดการผู้ใช้งาน**
   - เจ้าหน้าที่ (Staff)
   - ผู้อำนวยการจังหวัด (Provincial Director)
   - เลขาธิการสำนักฟื้นฟู (Secretary General)
   - บอร์ดบริหาร (Board)
   - ผู้ดูแลระบบ (Admin)

2. **การจัดการกลุ่มและสมาชิก**
   - ดึงข้อมูลจาก Big Data (Read-only) - ตอนนี้ใช้ Mock Data
   - กลุ่มต้องมีสมาชิกอย่างน้อย 20 คน

3. **การจัดการโครงการ - Multi-step Wizard**
   - **Step 1:** เลือกองค์กรเกษตรกรจาก Big Data
   - **Step 2:** กรอกข้อมูลโครงการ (ชื่อ, วงเงิน, วัตถุประสงค์)
   - **Step 3:** เลือกสมาชิกที่เข้าร่วมโครงการ
   - **Step 4:** กรอกรายละเอียดงบประมาณ (รายการค่าใช้จ่าย)
   - **Step 5:** กรอก 5 แผนงาน (แผนฟื้นฟู, พัฒนา, ส่งเสริม, ตลาด, อื่นๆ)
   - **Step 6:** กรอกสินทรัพย์และหนี้สิน (ไม่บังคับ)
   - **Step 7:** แนบเอกสารประกอบ (ไม่บังคับ)
   - **Step 8:** สรุปและส่งเรื่องเพื่ออนุมัติ
   - **Features:** Validation แต่ละ step, บันทึก draft, Auto-save

4. **Workflow การอนุมัติ (ตามวงเงิน)**
   ```
   โครงการใหม่ → ผู้อำนวยการจังหวัด → เลขาธิการสำนักฟื้นฟู
                                              ↓
                                   วงเงิน ≤ 500,000 บาท → อนุมัติเลย
                                   วงเงิน > 500,000 บาท → ส่งต่อบอร์ด → อนุมัติ
   ```

5. **Dashboard**
   - สถิติโครงการ (ทั้งหมด, รออนุมัติ, อนุมัติ, งบประมาณ)
   - รายการโครงการล่าสุด
   - กรองตามสถานะ

## โครงสร้างโปรเจค

```
frdfund/
├── backend/              # Node.js + Express + PostgreSQL
│   ├── config/          # Database configuration
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication middleware
│   ├── database/        # SQL schema
│   └── server.js        # Main server file
├── frontend/            # React + Vite
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── App.jsx      # Main app
│   │   └── styles.css   # Global styles
│   └── public/          # Static assets
└── doc/                 # เอกสารประกอบ
```

## การติดตั้ง

### ข้อกำหนดเบื้องต้น
- Node.js 18+
- PostgreSQL 14+
- npm หรือ yarn

### ขั้นตอนการติดตั้ง

#### 1. ติดตั้ง Backend

```powershell
cd backend
npm install
```

#### 2. ตั้งค่า Database

สร้าง database ใน PostgreSQL:
```sql
CREATE DATABASE frdfund;
```

แก้ไขไฟล์ `.env` ให้ตรงกับ database ของคุณ:
```powershell
cp .env.example .env
# แก้ไข .env (DB_HOST, DB_USER, DB_PASSWORD, etc.)
```

Run migration:
```powershell
# เข้า PostgreSQL และรัน schema
psql -U postgres -d frdfund -f database/schema.sql
```

#### 3. ติดตั้ง Frontend

```powershell
cd frontend
npm install
```

### เริ่มต้นใช้งาน

เปิด 2 terminals:

**Terminal 1 - Backend:**
```powershell
cd backend
npm start
# หรือ npm run dev (ถ้ามี nodemon)
```
Backend จะรันที่ `http://localhost:3000`

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```
Frontend จะรันที่ `http://localhost:5173`

## การใช้งาน

1. เปิดเบราว์เซอร์ที่ **http://localhost:5173**
2. Login ด้วยบัญชีทดสอบ:
   - **Admin:** `admin` / `admin123`
   - **Staff:** `staff01` / `staff123`
   - **ผอ.จังหวัด:** `pd_bangkok` / `pd123`
   - **เลขาธิการ:** `secretary` / `secretary123`
   - **บอร์ด:** `board01` / `board123`

3. เริ่มสร้างโครงการจาก Dashboard

## User Roles และสิทธิ์การใช้งาน

| Role | สิทธิ์ |
|------|--------|
| Staff | สร้างโครงการ, ดูสถานะโครงการของตนเอง |
| Provincial Director | พิจารณาเห็นชอบโครงการในจังหวัดตนเอง |
| Secretary General | อนุมัติโครงการ ≤ 500K, ส่งต่อโครงการ > 500K ไปบอร์ด |
| Board | อนุมัติโครงการ > 500K |
| Admin | จัดการผู้ใช้, ดูข้อมูลทั้งหมด |

## API Endpoints

### Authentication
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/register` - สมัครสมาชิก (สำหรับทดสอบ)

### Dashboard
- `GET /api/dashboard/stats` - สถิติโครงการ
- `GET /api/dashboard/recent-projects` - โครงการล่าสุด

### Groups (Big Data - Mock)
- `GET /api/groups` - รายการกลุ่มเกษตรกร
- `GET /api/groups/:id` - ข้อมูลกลุ่ม
- `GET /api/groups/:id/members` - สมาชิกในกลุ่ม

### Projects
- `GET /api/projects` - รายการโครงการ (filter ตาม role)
- `POST /api/projects` - เพิ่มโครงการ (draft)
- `GET /api/projects/:id` - รายละเอียดโครงการ
- `PUT /api/projects/:id` - แก้ไขโครงการ
- `POST /api/projects/:id/submit` - ส่งเรื่องเพื่ออนุมัติ
- `DELETE /api/projects/:id` - ลบโครงการ

### Approvals
- `GET /api/approvals/pending` - โครงการที่รอการพิจารณา (ตาม role)
- `POST /api/approvals/:projectId` - อนุมัติ/ไม่อนุมัติ
- `GET /api/approvals/history/:projectId` - ประวัติการอนุมัติ

### Users (Admin only)
- `GET /api/users` - รายการผู้ใช้
- `GET /api/users/:id` - ข้อมูลผู้ใช้
- `PUT /api/users/:id` - แก้ไขผู้ใช้
- `DELETE /api/users/:id` - ลบผู้ใช้

## เทคโนโลยีที่ใช้

### Backend
- **Node.js** & **Express** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **CSS Variables** - Theming

## Features พิเศษ

### Multi-step Wizard
- ✅ Progress indicator แสดงขั้นตอนปัจจุบัน
- ✅ Validation แต่ละ step (ต้องกรอกครบถึงจะไปต่อได้)
- ✅ บันทึก Draft ได้ตลอด
- ✅ กลับไปแก้ไข step ก่อนหน้าได้
- ✅ Summary page แสดงข้อมูลทั้งหมดก่อนส่ง

### Approval Workflow
- ✅ ตรวจสอบวงเงินอัตโนมัติ (≤ 500K vs > 500K)
- ✅ Route ไปผู้อนุมัติที่ถูกต้อง
- ✅ บันทึกประวัติการอนุมัติ
- ✅ Comment/หมายเหตุได้

### UI/UX
- ✅ โทนสีตามภาพตัวอย่าง (Teal + Dark accent)
- ✅ Responsive design
- ✅ Status badges มีสี (เขียว=อนุมัติ, เหลือง=รอ, แดง=ไม่อนุมัติ)
- ✅ Loading states
- ✅ Error handling

## การพัฒนาต่อ

### TODO
- [ ] เชื่อม Big Data API จริง (แทน Mock)
- [ ] Upload ไฟล์เอกสารจริง (ตอนนี้ mock)
- [ ] ระบบ ThaiID + LDAP authentication
- [ ] Email notification เมื่อมีโครงการรออนุมัติ
- [ ] Export รายงาน PDF/Excel
- [ ] ระบบอุทธรณ์
- [ ] Auto-save ทุก 30 วินาที
- [ ] Unit tests
- [ ] Docker deployment

## License

MIT

## ผู้พัฒนา

ระบบนี้พัฒนาโดย GitHub Copilot สำหรับกองทุนฟื้นฟูและพัฒนาเกษตรกร


# File Upload และ Comments System

## สรุปการพัฒนา

เพิ่มระบบอัพโหลดไฟล์และคอมเมนต์ในกระบวนการอนุมัติโครงการ

## 1. ระบบ File Upload

### Backend API Endpoints

สร้างไฟล์ใหม่: `backend/routes/documents.js`

**Endpoints ที่เพิ่ม:**

1. `POST /api/documents/:projectId/upload`
   - อัพโหลดไฟล์ไปยังโครงการ
   - รองรับไฟล์: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG
   - ขนาดไฟล์สูงสุด: 10MB
   - บันทึกข้อมูลใน `project_documents` table

2. `GET /api/documents/:projectId/documents`
   - ดึงรายการไฟล์ทั้งหมดของโครงการ
   - แสดงชื่อไฟล์, ขนาด, ผู้อัพโหลด, วันที่

3. `GET /api/documents/download/:filename`
   - ดาวน์โหลดไฟล์
   - ใช้ original filename

4. `GET /api/documents/view/:filename`
   - เปิดดูไฟล์ (สำหรับ PDF และรูปภาพ)
   - แสดงใน browser โดยตรง

5. `DELETE /api/documents/:documentId`
   - ลบไฟล์ (เฉพาะโครงการที่ยังเป็น draft)
   - ลบทั้งไฟล์จริงและข้อมูลใน database

### Frontend Implementation

**อัพเดทไฟล์:** `frontend/src/pages/ProjectDetail.jsx`

**Features ที่เพิ่ม:**

1. **ปุ่มอัพโหลด**
   - แสดงเฉพาะโครงการที่ status = 'draft'
   - คลิกแล้วเปิด file dialog

2. **ตารางแสดงไฟล์**
   - ชื่อไฟล์ (คลิกเพื่อดาวน์โหลด)
   - ประเภทเอกสาร
   - ขนาดไฟล์ (แสดงเป็น KB/MB)
   - ผู้อัพโหลด
   - วันที่อัพโหลด

3. **ปุ่มจัดการไฟล์**
   - 👁️ ปุ่มดูไฟล์ (เปิดใน tab ใหม่)
   - 🗑️ ปุ่มลบไฟล์ (เฉพาะ draft)

4. **Functions ที่เพิ่ม:**
   ```javascript
   handleFileUpload(e)      // อัพโหลดไฟล์
   handleViewDocument(filename)  // เปิดดูไฟล์
   handleDeleteDocument(docId)   // ลบไฟล์
   formatFileSize(bytes)    // แปลงขนาดไฟล์เป็น KB/MB
   ```

### การติดตั้ง Package

```bash
docker exec -it frdfund-backend npm install multer
```

## 2. ระบบ Comments

### Database Schema

เพิ่ม column ใน `project_approvals` table:

```sql
ALTER TABLE project_approvals 
ADD COLUMN IF NOT EXISTS comment TEXT;
```

### Backend API

**อัพเดทไฟล์:** `backend/routes/approvals.js`

- API endpoint `/api/approvals/:projectId` รับ field `comments` แล้ว
- บันทึกคอมเมนต์พร้อมกับการอนุมัติ/ไม่อนุมัติ
- GET `/api/approvals/history/:projectId` ส่งคอมเมนต์กลับมาด้วย

### Frontend Display

**หน้า Approvals (`frontend/src/pages/Approvals.jsx`):**
- มี textarea สำหรับกรอกความเห็น
- แสดงคอมเมนต์ใน timeline ของประวัติการอนุมัติ

**หน้า Project Detail (`frontend/src/pages/ProjectDetail.jsx`):**
- Tab "ประวัติการอนุมัติ" แสดง timeline พร้อมคอมเมนต์
- แสดงผู้พิจารณา, ผลการพิจารณา, ความเห็น, วันที่

## 3. UI/UX Improvements

### CSS Styles

**อัพเดทไฟล์:** `frontend/src/styles.css`

เพิ่ม styles:
```css
.btn-primary     // ปุ่มหลักสีน้ำเงิน
.btn-icon        // ปุ่ม icon แบบโปร่งใส
.btn-icon:hover  // เอฟเฟกต์ hover (scale 1.1)
```

### การแสดงผล

1. **Timeline แสดงความคืบหน้าการอนุมัติ**
   - ✓ อนุมัติ (สีเขียว)
   - ✗ ไม่อนุมัติ (สีแดง)
   - ○ รอพิจารณา (สีเทา)

2. **แสดงข้อมูลครบถ้วน**
   - ระดับการอนุมัติ
   - ผู้พิจารณา
   - สถานะ
   - ความเห็น (ถ้ามี)
   - วันที่-เวลา

## 4. Security Features

1. **Authentication**
   - ทุก endpoint ต้องใช้ JWT token
   - ตรวจสอบสิทธิ์ผู้ใช้

2. **File Upload Security**
   - จำกัดประเภทไฟล์ที่อนุญาต
   - จำกัดขนาดไฟล์ (10MB)
   - validate mime type และ extension
   - เก็บไฟล์ด้วยชื่อแบบ random (timestamp + random number)

3. **Access Control**
   - อัพโหลด/ลบไฟล์ได้เฉพาะโครงการ draft
   - ดาวน์โหลดต้อง login

## 5. การทดสอบ

### ขั้นตอนการทดสอบ:

1. **ทดสอบอัพโหลดไฟล์:**
   - เปิดหน้า Project Detail
   - คลิก "+ อัพโหลดเอกสาร"
   - เลือกไฟล์ PDF หรือ DOC
   - ตรวจสอบว่าไฟล์ปรากฏในตาราง

2. **ทดสอบดูไฟล์:**
   - คลิกไอคอน 👁️ ข้างไฟล์
   - ตรวจสอบว่าไฟล์เปิดใน tab ใหม่

3. **ทดสอบดาวน์โหลด:**
   - คลิกที่ชื่อไฟล์
   - ตรวจสอบว่าไฟล์ดาวน์โหลดมาถูกต้อง

4. **ทดสอบคอมเมนต์:**
   - ไปหน้า Approvals
   - เปิดโครงการรออนุมัติ
   - กรอกความเห็นใน textarea
   - กด "อนุมัติ" หรือ "ไม่อนุมัติ"
   - ตรวจสอบว่าความเห็นแสดงใน timeline

5. **ทดสอบลบไฟล์:**
   - คลิกไอคอน 🗑️ (เฉพาะโครงการ draft)
   - ยืนยันการลบ
   - ตรวจสอบว่าไฟล์หายจากตาราง

## 6. Files Changed

### Backend:
- ✅ `backend/routes/documents.js` (NEW)
- ✅ `backend/routes/approvals.js` (UPDATED - already supports comments)
- ✅ `backend/server.js` (UPDATED - added document routes)
- ✅ `backend/package.json` (UPDATED - added multer)

### Frontend:
- ✅ `frontend/src/pages/ProjectDetail.jsx` (UPDATED)
- ✅ `frontend/src/pages/Approvals.jsx` (already had comments support)
- ✅ `frontend/src/styles.css` (UPDATED)

### Database:
- ✅ `project_approvals` table - added `comment` column
- ✅ `project_documents` table - already exists

## 7. Known Issues / Future Enhancements

### ที่ควรปรับปรุง:

1. **Progress Indicator:**
   - เพิ่ม loading spinner ขณะอัพโหลด

2. **Preview:**
   - เพิ่มการแสดง preview รูปภาพใน modal
   - PDF viewer แบบ inline

3. **Multiple Upload:**
   - อัพโหลดหลายไฟล์พร้อมกัน

4. **File Organization:**
   - จัดหมวดหมู่เอกสาร (เช่น เอกสารโครงการ, หนังสือรับรอง, ฯลฯ)

5. **Version Control:**
   - เก็บประวัติการแก้ไขไฟล์

## 8. Deployment Notes

### Docker Commands:

```bash
# Restart backend after changes
docker restart frdfund-backend

# Restart frontend after changes
docker restart frdfund-frontend

# Check container status
docker ps --filter "name=frdfund"

# View logs
docker logs frdfund-backend
docker logs frdfund-frontend
```

### Uploads Directory:

ไฟล์จะถูกเก็บใน: `backend/uploads/`

**Important:** ต้องสร้างโฟลเดอร์นี้หรือ mount volume ใน Docker:

```yaml
volumes:
  - ./backend/uploads:/app/uploads
```

## สรุป

ระบบ File Upload และ Comments ได้ถูกพัฒนาและติดตั้งเรียบร้อยแล้ว:

✅ อัพโหลดเอกสารแนบโครงการได้  
✅ ดูและดาวน์โหลดเอกสารได้  
✅ ลบเอกสารได้ (เฉพาะ draft)  
✅ แสดงความเห็นในการอนุมัติ  
✅ แสดง timeline การอนุมัติพร้อมคอมเมนต์  

ระบบพร้อมใช้งานหลังจาก restart containers ทั้งสองแล้ว

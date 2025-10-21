# ระบบจัดการโครงการกองทุนฟื้นฟูและพัฒนาเกษตรกร - Docker Deployment

## การรันด้วย Docker

### ข้อกำหนดเบื้องต้น
- Docker Desktop หรือ Docker Engine
- Docker Compose

### วิธีการรัน

#### 1. รันทั้งระบบ (PostgreSQL + Backend + Frontend)

```powershell
# ที่ root directory ของโปรเจค
docker-compose up -d
```

ระบบจะรัน:
- **PostgreSQL:** `localhost:5432`
- **Backend API:** `localhost:3000`
- **Frontend:** `localhost:80` (หรือ `http://localhost`)

#### 2. ดู logs

```powershell
# ดู logs ทั้งหมด
docker-compose logs -f

# ดู logs เฉพาะ service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

#### 3. หยุดระบบ

```powershell
docker-compose down
```

#### 4. หยุดและลบ volumes (ลบข้อมูล database)

```powershell
docker-compose down -v
```

#### 5. Rebuild images

```powershell
docker-compose up -d --build
```

### การเข้าใช้งาน

เปิดเบราว์เซอร์ไปที่:
```
http://localhost
```

**บัญชีทดสอบ:**
- Admin: `admin` / `admin123`
- Staff: `staff01` / `staff123`
- ผอ.จังหวัด: `pd_bangkok` / `pd123`

### การเข้าถึง Database

```powershell
# เข้าใช้ psql
docker exec -it frdfund-postgres psql -U postgres -d frdfund

# หรือใช้ GUI tools เชื่อมต่อที่
Host: localhost
Port: 5432
Database: frdfund
User: postgres
Password: postgres123
```

### การ Debug

#### ตรวจสอบ containers ที่รันอยู่

```powershell
docker ps
```

#### เข้าไปใน container

```powershell
# Backend
docker exec -it frdfund-backend sh

# Frontend
docker exec -it frdfund-frontend sh

# PostgreSQL
docker exec -it frdfund-postgres sh
```

#### ตรวจสอบ health status

```powershell
docker-compose ps
```

### Environment Variables

สำหรับ production ให้แก้ไขค่าใน `docker-compose.yml`:

```yaml
environment:
  POSTGRES_PASSWORD: your_secure_password
  JWT_SECRET: your_jwt_secret
```

### Volume Management

ข้อมูล PostgreSQL จะถูกเก็บใน Docker volume `postgres_data`

```powershell
# ดู volumes
docker volume ls

# ลบ volume (ข้อมูลจะหายทั้งหมด!)
docker volume rm frdfund_postgres_data
```

### Production Deployment

#### 1. สร้าง production image

```powershell
docker-compose -f docker-compose.yml build
```

#### 2. Push to registry (ถ้ามี)

```powershell
docker tag frdfund-backend:latest your-registry/frdfund-backend:v1.0.0
docker push your-registry/frdfund-backend:v1.0.0
```

#### 3. Deploy to server

คัดลอก `docker-compose.yml` ไปยัง server แล้วรัน:

```bash
docker-compose up -d
```

### Backup & Restore

#### Backup Database

```powershell
docker exec frdfund-postgres pg_dump -U postgres frdfund > backup.sql
```

#### Restore Database

```powershell
cat backup.sql | docker exec -i frdfund-postgres psql -U postgres frdfund
```

### Troubleshooting

#### Port already in use

```powershell
# เปลี่ยน port ใน docker-compose.yml
ports:
  - "8080:80"  # เปลี่ยนจาก 80 เป็น 8080
```

#### Database connection failed

1. ตรวจสอบว่า PostgreSQL container รันอยู่: `docker ps`
2. ดู logs: `docker-compose logs postgres`
3. รอให้ healthcheck pass ก่อน

#### Frontend ไม่เชื่อม Backend

ตรวจสอบว่า `nginx.conf` มี proxy_pass ที่ถูกต้อง

### การพัฒนาต่อ (Development Mode)

สร้าง `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
    command: npm run dev
    volumes:
      - ./backend:/app
      - /app/node_modules
    ports:
      - "3000:3000"

  frontend:
    build:
      context: ./frontend
    command: npm run dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "5173:5173"
```

รัน development mode:
```powershell
docker-compose -f docker-compose.dev.yml up
```

## โครงสร้างระบบ

```
frdfund/
├── docker-compose.yml       # Docker orchestration
├── backend/
│   ├── Dockerfile          # Backend image
│   ├── server.js
│   └── ...
├── frontend/
│   ├── Dockerfile          # Frontend image
│   ├── nginx.conf          # Nginx config
│   └── ...
└── README.md
```

## License

MIT

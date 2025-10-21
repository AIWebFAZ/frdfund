#!/bin/bash
# FRD Fund Auto Deployment Script
# สคริปต์นี้จะติดตั้งและรันระบบอัตโนมัติทั้งหมด

echo "========================================="
echo "   FRD Fund Auto Deployment Script"
echo "========================================="
echo ""

# 1. ติดตั้ง Docker (ถ้ายังไม่มี)
echo "Step 1: Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo apt update
    sudo apt install -y docker.io docker-compose
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    echo "✓ Docker installed successfully"
else
    echo "✓ Docker already installed"
fi

# 2. สร้างโฟลเดอร์
echo ""
echo "Step 2: Creating project directory..."
mkdir -p /home/tom/frdfund
cd /home/tom/frdfund
echo "✓ Directory created: /home/tom/frdfund"

# 3. แจ้งให้ Upload ไฟล์
echo ""
echo "========================================="
echo "   📁 Please Upload Files"
echo "========================================="
echo ""
echo "Upload these files to: /home/tom/frdfund/"
echo ""
echo "Required files:"
echo "  1. backend/ folder"
echo "  2. frontend/ folder"
echo "  3. docker-compose.prod.yml"
echo ""
echo "You can use:"
echo "  - FTP/SFTP (FileZilla, WinSCP)"
echo "  - SCP command"
echo "  - Or drag & drop in VS Code Remote SSH"
echo ""
read -p "Press Enter when upload is complete..."

# 4. ตรวจสอบไฟล์
echo ""
echo "Step 3: Verifying uploaded files..."
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Error: docker-compose.prod.yml not found!"
    echo "Please upload the file and run this script again."
    exit 1
fi
if [ ! -d "backend" ]; then
    echo "❌ Error: backend folder not found!"
    exit 1
fi
if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend folder not found!"
    exit 1
fi
echo "✓ All required files found"

# 5. Stop old containers (ถ้ามี)
echo ""
echo "Step 4: Stopping old containers..."
sudo docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
echo "✓ Old containers stopped"

# 6. Build และ Run
echo ""
echo "Step 5: Building Docker images (this may take a few minutes)..."
sudo docker-compose -f docker-compose.prod.yml build

echo ""
echo "Step 6: Starting containers..."
sudo docker-compose -f docker-compose.prod.yml up -d

# 7. รอให้ containers พร้อม
echo ""
echo "Step 7: Waiting for services to start..."
sleep 10

# 8. ตรวจสอบ Status
echo ""
echo "Step 8: Checking container status..."
sudo docker-compose -f docker-compose.prod.yml ps

# 9. แสดง Logs
echo ""
echo "Backend logs:"
sudo docker logs frdfund-backend --tail 10
echo ""
echo "Frontend logs:"
sudo docker logs frdfund-frontend --tail 10

# 10. เปิด Firewall
echo ""
echo "Step 9: Configuring firewall..."
sudo ufw allow 80/tcp 2>/dev/null || true
sudo ufw allow 3000/tcp 2>/dev/null || true
echo "✓ Firewall configured"

# 11. แสดงข้อมูลการเข้าใช้งาน
echo ""
echo "========================================="
echo "   ✅ Deployment Complete!"
echo "========================================="
echo ""
echo "🌐 Access your application at:"
echo "   http://210.1.58.138"
echo ""
echo "👤 Default Login:"
echo "   Username: admin"
echo "   Password: Admin@123"
echo ""
echo "📊 Useful commands:"
echo "   View logs:    sudo docker-compose -f docker-compose.prod.yml logs -f"
echo "   Restart:      sudo docker-compose -f docker-compose.prod.yml restart"
echo "   Stop:         sudo docker-compose -f docker-compose.prod.yml stop"
echo "   Start:        sudo docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "========================================="

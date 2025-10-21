# คำสั่ง Deploy ระบบไปยัง Server
# Server: 210.1.58.138
# User: tom

## 1. เตรียมไฟล์บน Local
# Zip โปรเจคทั้งหมด (ไม่รวม node_modules และ .git)
Compress-Archive -Path c:\frdfund\* -DestinationPath c:\frdfund-deploy.zip -Force -ExcludeDirectory node_modules,.git

## 2. Upload ไฟล์ไปยัง Server ด้วย SCP
scp c:\frdfund-deploy.zip tom@210.1.58.138:/home/tom/

## 3. SSH เข้า Server
ssh tom@210.1.58.138

## 4. บน Server ให้รันคำสั่งเหล่านี้:
# cd /home/tom
# unzip -o frdfund-deploy.zip -d frdfund
# cd frdfund
# 
# # ติดตั้ง Docker (ถ้ายังไม่มี)
# sudo apt update
# sudo apt install -y docker.io docker-compose
# sudo systemctl start docker
# sudo systemctl enable docker
# sudo usermod -aG docker tom
# 
# # Build และ Run ด้วย Docker Compose
# sudo docker-compose -f docker-compose.prod.yml down
# sudo docker-compose -f docker-compose.prod.yml build
# sudo docker-compose -f docker-compose.prod.yml up -d
# 
# # ตรวจสอบ Status
# sudo docker-compose -f docker-compose.prod.yml ps
# sudo docker logs frdfund-backend --tail 20
# sudo docker logs frdfund-frontend --tail 20

## 5. เปิด Firewall (ถ้าจำเป็น)
# sudo ufw allow 80/tcp
# sudo ufw allow 3000/tcp
# sudo ufw enable

## 6. เข้าใช้งานผ่าน Browser
# http://210.1.58.138
# Login: admin / Admin@123

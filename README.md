# SABAMAS Billing System
Aplikasi Manajemen Billing & Pembayaran Sampah / Iuran Warga.

## 📋 Tentang Aplikasi
Aplikasi ini dibangun menggunakan teknologi modern untuk performa tinggi dan penggunaan resource yang efisien (cocok untuk VPS kecil).
- **Frontend**: Next.js (TypeScript) - Interface web yang cepat.
- **Backend**: NestJS (TypeScript) - Server API yang tangguh.
- **Database**: SQLite (Ringan, tanpa perlu install server database berat).
- **ORM**: Prisma - Untuk manajemen database.

---

## 🚀 Panduan Instalasi di VPS (Production)

Panduan ini ditujukan untuk spesifikasi VPS minimal: **2 Core CPU, 2 GB RAM, 30 GB SSD**.

### 1. Persiapan Server (Wajib)
Jalankan perintah berikut sebagai `root` atau user dengan akses `sudo`.

#### A. Update Server & Install Tools Dasar
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl unzip build-essential
```

#### B. Setup Swap Memory (Sangat PENTING untuk RAM 2GB!)
Agar proses build tidak crash karena kehabisan RAM.
```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### C. Install Node.js (Versi 20 LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
# Cek versi
node -v 
# Output harus v20.x.x
```

#### D. Install PM2 (Process Manager)
Untuk menjalankan aplikasi secara otomatis (background service).
```bash
sudo npm install -g pm2
```

---

### 2. Instalasi Aplikasi

#### A. Clone Repository
Ganti URL di bawah dengan URL repository GitHub Anda.
```bash
cd /var/www
sudo mkdir sabamas
sudo chown -R $USER:$USER sabamas
git clone https://github.com/USERNAME_ANDA/aplikasi-sabamas.git sabamas
cd sabamas
```

#### B. Setup Backend
```bash
cd backend
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Setup Environment Variables
cp .env.example .env
nano .env

# ==========================================
# PENTING: ISI DENGAN KONEKSI SUPABASE ANDA !
# ==========================================
# DATABASE_URL="postgresql://postgres.[id]:[pass]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
# DIRECT_URL="postgresql://postgres.[id]:[pass]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
#
# Simpan: Ctrl+O, Enter, Ctrl+X

# 3. Setup Database (Schema)
# Karena sudah migrate di laptop, cukup generate client saja
npx prisma generate

# 4. Build Backend
npm run build
```

#### C. Setup Frontend
```bash
cd ../frontend
# 1. Install dependencies
npm install

# 2. Setup Environment Variables
cp .env.example .env
nano .env
# WAJIB DIUBAH DI FRONTEND .ENV:
# NEXT_PUBLIC_API_URL=https://domain_anda.com/api  <-- Ganti dengan Domain/IP VPS (HTTPS disarankan)
```

# 3. Build & Jalankan Aplikasi

#### A. Build Frontend (Memakan waktu & RAM)
```bash
# Pastikan masih di folder frontend
npm run build
```

#### B. Jalankan dengan PM2
Kita akan menjalankan Backend di port `3001` dan Frontend di port `3000`.

```bash
# Kembal ke root folder project
cd /var/www/sabamas

# 1. Jalankan Backend
cd backend
pm2 start dist/main.js --name "sabamas-api"

# 2. Jalankan Frontend
cd ../frontend
pm2 start npm --name "sabamas-web" -- start
```

#### C. Simpan Konfigurasi PM2 (Auto Start saat Restart VPS)
```bash
pm2 save
pm2 startup
# Copy paste command yang muncul di layar terminal setelah ketik pm2 startup
```

Sekarang aplikasi sudah berjalan!
- API bisa dicek di: `http://IP_VPS:3001/api`
- Web bisa dicek di: `http://IP_VPS:3000`

---

## 🌐 Setup Nginx (Agar bisa diakses tanpa Port)

Instal Nginx agar aplikasi bisa diakses via `http://IP_VPS` atau `http://domain.com` tanpa mengetik `:3000`.

1. **Install Nginx**:
   ```bash
   sudo apt install nginx -y
   ```

2. **Buat Config Baru**:
   ```bash
   sudo nano /etc/nginx/sites-available/sabamas
   ```

3. **Isi Config (Copy Paste ini)**:
   Ganti `domain_anda.com` dengan IP VPS atau Domain Anda.
   ```nginx
   server {
       listen 80;
       server_name domain_anda.com www.domain_anda.com; # Atau IP VPS jika belum ada domain

       # Frontend (Next.js)
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # Backend (NestJS API)
       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # Static Files (Uploads/Images)
       location /uploads {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Aktifkan Config**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/sabamas /etc/nginx/sites-enabled/
   sudo nginx -t # Cek error
   sudo systemctl restart nginx
   ```

---

## 🔄 Cara Update Aplikasi (Jika ada perubahan fitur)

Jika Anda sudah update fitur di lokal dan sudah push ke GitHub, lakukan ini di VPS:

1. **Masuk ke folder project**:
   ```bash
   cd /var/www/sabamas
   ```

2. **Tarik kode terbaru**:
   ```bash
   git pull origin main
   ```

3. **Install ulang dependency (jaga-jaga ada library baru)**:
   ```bash
   cd backend && npm install --legacy-peer-deps
   cd ../frontend && npm install
   ```

4. **Update Database (Jika ada perubahan tabel)**:
   ```bash
   cd ../backend
   npx prisma migrate deploy
   ```

5. **Build Ulang**:
   ```bash
   cd ../backend && npm run build
   cd ../frontend && npm run build
   ```

6. **Restart Aplikasi**:
   ```bash
   pm2 restart all --update-env
   ```

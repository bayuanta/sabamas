# SABAMAS Backend API

Sistem Billing Sampah - Backend API menggunakan NestJS, Prisma, dan SQLite.

## Features Implemented

### ✅ Tahap 1: Authentication & Basic CRUD
- [x] JWT Authentication (Admin & Customer)
- [x] User Management (Admin only)
- [x] Customer CRUD dengan filters & pagination
- [x] Database Schema dengan 8 entities
- [x] Prisma ORM dengan SQLite

### ✅ Tahap 2: Core Business Logic
- [x] **Tariff Priority Calculator** (Override > History > Default)
- [x] **Arrears Calculator** (Tunggakan dengan month tracking)
- [x] Tariff Category Management
- [x] Tariff Override Management

### ✅ Tahap 3: Transaction Management
- [x] Payment Processing dengan timezone WIB
- [x] Undeposited Funds Tracking
- [x] Deposit Management (Setoran)
- [x] Payment History dengan filters

### ✅ Tahap 4: Reporting
- [x] Dashboard Statistics
- [x] Payment Reports
- [x] Arrears Reports
- [x] Real-time WIB timestamp handling

## Quick Start

### Prerequisites
- Node.js 24.x
- npm 11.x

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with sample data
npm run prisma:seed

# Start development server
npm run start:dev
```

Server will run on: **http://localhost:3001**

## Seed Data

The database is seeded with:
- **2 Users**:
  - Admin: `admin@sabamas.com` / `admin123`
  - Collector: `collector@sabamas.com` / `collector123`
- **4 Tariff Categories**: Rumah Tangga (Rp 15.000), Toko/Warung (Rp 25.000), Rumah Makan (Rp 40.000), Perkantoran (Rp 50.000)
- **10 Customers** with various locations (RT 01-04)
- **20+ Payments** (cash and transfer)
- **Customer Portal Access**: All customers can login with PIN `1234`

## API Endpoints

### Authentication
```
POST /api/auth/login                    # Admin/Staff login
POST /api/auth/customer-login           # Customer portal login
```

### Users (Admin Only)
```
GET    /api/users                       # List all users
POST   /api/users                       # Create user
GET    /api/users/:id                   # Get user details
PATCH  /api/users/:id                   # Update user
DELETE /api/users/:id                   # Delete user
```

### Customers
```
GET    /api/customers                   # List customers (with filters, pagination)
POST   /api/customers                   # Create customer
GET    /api/customers/:id               # Get customer details with arrears
PATCH  /api/customers/:id               # Update customer
DELETE /api/customers/:id               # Delete customer
GET    /api/customers/wilayah/list      # Get unique wilayah list
```

#### Query Parameters for GET /api/customers:
- `search`: Search by nama, alamat, nomor_telepon
- `wilayah`: Filter by wilayah
- `status`: Filter by status (aktif/nonaktif)
- `sortBy`: Sort field (default: createdAt)
- `sortOrder`: asc/desc
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)

### Tariffs
```
GET    /api/tariffs/categories                    # List categories
POST   /api/tariffs/categories                    # Create category
GET    /api/tariffs/categories/:id                # Get category
PATCH  /api/tariffs/categories/:id                # Update category
DELETE /api/tariffs/categories/:id                # Delete category

POST   /api/tariffs/overrides                     # Create tariff override
GET    /api/tariffs/overrides/customer/:customerId # Get customer overrides
DELETE /api/tariffs/overrides/:id                 # Delete override
```

### Payments
```
GET    /api/payments                   # List payments (with filters)
POST   /api/payments                   # Create payment
GET    /api/payments/:id               # Get payment details
DELETE /api/payments/:id               # Cancel payment
GET    /api/payments/undeposited       # Get undeposited cash payments
```

#### Query Parameters for GET /api/payments:
- `dateFrom`: Filter from date (ISO 8601)
- `dateTo`: Filter to date (ISO 8601)
- `metode_bayar`: tunai/transfer
- `page`: Page number
- `limit`: Items per page (default: 30)

### Deposits (Setoran)
```
GET    /api/deposits                   # List deposits
POST   /api/deposits                   # Create deposit
GET    /api/deposits/:id               # Get deposit details
DELETE /api/deposits/:id               # Cancel deposit
```

### Reports
```
GET    /api/reports/dashboard          # Dashboard statistics
GET    /api/reports/payments           # Payment report
GET    /api/reports/arrears            # Arrears report
```

#### Query Parameters:
- **Dashboard**: No parameters
- **Payments**: `dateFrom`, `dateTo`, `metode_bayar`
- **Arrears**: `wilayah`, `sortBy` (amount_asc/amount_desc)

## Key Features

### 1. Tariff Priority System
The system implements a 3-level priority for calculating tariffs:
1. **TarifOverride** (Highest) - Manual overrides per customer per month
2. **TarifHistory** - Custom tariff history
3. **TarifCategory** (Default) - Base category tariff

### 2. Arrears Calculation
- Calculates from `tanggal_bergabung` to current month
- Excludes paid months (from Payment records)
- Returns detailed breakdown with source (Override/History/Default)
- Real-time calculation on demand

### 3. Timezone Handling
All timestamps use **WIB (UTC+7)** timezone:
- Payment dates
- User login timestamps
- All datetime fields

### 4. JSON Field Handling
Since SQLite doesn't support arrays:
- `bulan_dibayar` stored as JSON string
- `payment_ids` stored as JSON string
- Automatically parsed/stringified in services

## Database Schema

- **Customer**: Pelanggan data with tariff association
- **TarifCategory**: Base tariff categories
- **TarifHistory**: Custom tariff history per customer
- **TarifOverride**: Manual tariff overrides (highest priority)
- **Payment**: Payment transactions
- **Setoran**: Deposits to bendahara
- **User**: Admin/Staff users
- **CustomerAccess**: Portal access for customers

## Development Commands

```bash
npm run start:dev          # Start dev server
npm run build              # Build for production
npm run start              # Start production server

npm run prisma:generate    # Generate Prisma Client
npm run prisma:migrate     # Run migrations
npm run prisma:seed        # Seed database
npm run prisma:studio      # Open Prisma Studio (DB GUI)
```

## Tech Stack

- **Framework**: NestJS 11
- **ORM**: Prisma 5.22
- **Database**: SQLite (dev) / PostgreSQL (production ready)
- **Authentication**: JWT + Bcrypt
- **Validation**: class-validator, class-transformer

## Production Notes

To use PostgreSQL in production:
1. Update `prisma/schema.prisma` datasource to `postgresql`
2. Update `.env` with PostgreSQL connection string
3. Run migrations: `npm run prisma:migrate`

## API Response Format

### Success Response
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 50,
    "totalPages": 2
  }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

## License

Private - SABAMAS Project

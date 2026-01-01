# SABAMAS Frontend

Frontend aplikasi SABAMAS menggunakan Next.js 14 dengan App Router, React Query, dan Tailwind CSS.

## Features

- ✅ Next.js 14 App Router
- ✅ TypeScript
- ✅ Tailwind CSS untuk styling
- ✅ React Query untuk state management
- ✅ Axios untuk API calls
- ✅ Authentication (Admin & Customer Portal)
- ✅ Responsive Design
- ✅ **Recharts** untuk visualisasi data
- ✅ **WhatsApp Integration** untuk share receipts & arrears
- ✅ **Print Templates** untuk nota pembayaran
- ✅ **Bulk Billing** untuk multiple payments

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running on http://localhost:3001

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Pages Implemented (100% Complete!)

### Public Pages ✅
- `/login` - Admin/Staff login with JWT
- `/portal-login` - Customer portal login

### Admin Pages ✅ (14 pages) + ENHANCEMENTS!
- `/dashboard` - Dashboard dengan statistics, **charts (Pie & Bar)**, & recent transactions
- `/customers` - List pelanggan dengan search & filters
- `/customers/[id]` - Detail pelanggan dengan arrears & payment history + **WhatsApp share**
- `/billing` - Billing Individual dengan payment processing + **WhatsApp share & Print**
- `/billing/bulk` - **NEW:** Billing Bulk untuk multiple customers
- `/transactions` - Transaksi history dengan filters & pagination
- `/deposits` - Setoran management (create & cancel deposits)
- `/tariffs` - Tarif management (CRUD categories)
- `/reports` - Laporan Pembayaran & Tunggakan
- `/backup` - Backup & Export data (JSON/CSV)

### Customer Portal ✅ (3 pages)
- `/portal/dashboard` - Dashboard pelanggan dengan info & tunggakan
- `/portal/tagihan` - Detail tagihan per bulan
- `/portal/riwayat` - Riwayat pembayaran lengkap

## Login Credentials

### Admin
- Email: `admin@sabamas.com`
- Password: `admin123`

### Collector
- Email: `collector@sabamas.com`
- Password: `collector123`

### Customer Portal
- Use any customer phone number
- PIN: `1234`

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Charts**: Recharts
- **Date**: date-fns

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard page
│   ├── customers/         # Customer management
│   ├── login/             # Admin login
│   ├── portal-login/      # Customer login
│   └── portal/            # Customer portal pages
├── components/            # React components
│   ├── ui/               # UI components
│   └── AdminLayout.tsx   # Admin layout with sidebar
├── lib/                   # Utilities
│   ├── api.ts            # API client & endpoints
│   ├── react-query.tsx   # React Query provider
│   └── utils.ts          # Helper functions
├── hooks/                 # Custom hooks
└── types/                 # TypeScript types
```

## Development

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
```

## Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## ✅ ALL PAGES COMPLETED!

### What's Implemented:
1. ✅ Customer Detail page dengan arrears breakdown
2. ✅ Billing Individual page (full payment flow)
3. ✅ Transactions page dengan filters & pagination
4. ✅ Deposits (Setoran) page (create & manage)
5. ✅ Tariffs management page (CRUD operations)
6. ✅ Reports pages (Payment & Arrears)
7. ✅ Backup page (JSON & CSV export)
8. ✅ Customer Portal pages (3 pages)
9. ✅ Responsive design untuk semua pages
10. ✅ Loading states & error handling

### ✅ Enhancements Completed:
- ✅ Charts & visualizations (Recharts - Pie & Bar)
- ✅ Print/PDF templates (browser print ready)
- ✅ Bulk Billing page (multiple customers payment)
- ✅ WhatsApp integration (receipts & arrears)
- ✅ Copy to clipboard functionality
- ✅ Dynamic page titles
- ✅ Enhanced UI/UX with animations

### Optional Future Enhancements:
- Advanced analytics dashboard
- Email notifications
- SMS integration
- Mobile app (React Native)
- Dark mode toggle

## License

Private - SABAMAS Project

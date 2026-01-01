// User types
export interface User {
  id: string
  nama: string
  email: string
  role: 'admin' | 'collector' | 'finance'
  status: 'aktif' | 'nonaktif'
  last_login?: string
  createdAt: string
  updatedAt: string
}

// Customer types
export interface Customer {
  id: string
  nama: string
  alamat: string
  wilayah: string
  nomor_telepon?: string
  tarif_id: string
  tanggal_efektif_tarif: string
  status: 'aktif' | 'nonaktif'
  tanggal_bergabung: string
  createdAt: string
  updatedAt: string
  tarif?: TarifCategory
  tunggakan?: number
  bulan_tunggakan?: number
}

// Tariff types
export interface TarifCategory {
  id: string
  nama_kategori: string
  harga_per_bulan: number
  deskripsi?: string
  createdAt: string
  updatedAt: string
}

export interface TarifOverride {
  id: string
  customer_id: string
  bulan_berlaku: string
  tarif_amount: number
  catatan?: string
  created_by_user: string
  createdAt: string
  updatedAt: string
}

// Payment types
export interface Payment {
  id: string
  customer_id: string
  customer_nama: string
  tanggal_bayar: string
  bulan_dibayar: string[]
  jumlah_bayar: number
  metode_bayar: 'tunai' | 'transfer'
  catatan?: string
  is_deposited: boolean
  createdAt: string
  updatedAt: string
  customer?: Partial<Customer>
}

// Deposit types
export interface Setoran {
  id: string
  tanggal_setor: string
  jumlah_setor: number
  periode_awal: string
  periode_akhir: string
  catatan?: string
  payment_ids: string[]
  createdAt: string
  updatedAt: string
  payments?: Payment[]
}

// Arrears types
export interface ArrearsDetail {
  month: string
  amount: number
  source: 'override' | 'history' | 'default'
  details?: string
}

export interface ArrearsResult {
  customerId: string
  customerName: string
  totalArrears: number
  arrearMonths: ArrearsDetail[]
  totalMonths: number
}

// Auth types
export interface LoginResponse {
  access_token: string
  user: {
    id: string
    nama: string
    email?: string
    role?: string
    type: 'admin' | 'customer'
  }
}

// Dashboard types
export interface DashboardStats {
  pemasukanHariIni: number
  pemasukanBulanIni: number
  wargaBayarHariIni: number
  wargaBayarBulanIni: number
  totalTunggakan: number
  totalCustomers: number
  recentPayments: Payment[]
}

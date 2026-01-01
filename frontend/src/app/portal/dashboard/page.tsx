'use client'

import PortalLayout from '@/components/PortalLayout'
import { useQuery } from '@tanstack/react-query'
import { customersApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import {
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  MapPin,
  Phone,
  CreditCard,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  Clock
} from 'lucide-react'
import { useEffect, useState } from 'react'

export default function PortalDashboardPage() {
  const [customerId, setCustomerId] = useState<string>('')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setCustomerId(user.id)
    }
  }, [])

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer-portal', customerId],
    queryFn: async () => {
      const { data } = await customersApi.getOne(customerId)
      return data
    },
    enabled: !!customerId,
    retry: 1,
  })

  // Loading Skeleton
  if (isLoading || !customer) {
    return (
      <PortalLayout>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl shadow-sm border border-gray-100 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-white rounded-2xl shadow-sm border border-gray-100 animate-pulse" />
          <div className="h-96 bg-white rounded-2xl shadow-sm border border-gray-100 animate-pulse" />
        </div>
      </PortalLayout>
    )
  }

  const hasArrears = customer.arrears && customer.arrears.totalArrears > 0
  const recentPayments = customer.payments?.slice(0, 3) || []

  return (
    <PortalLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Urgent Alert */}
        {hasArrears && (
          <div className="rounded-2xl bg-red-50 border border-red-100 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 shadow-sm">
            <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">Tagihan Belum Dibayar</h3>
              <p className="text-gray-600 mt-1">
                Halo {customer.nama}, Anda memiliki tagihan sebesar <span className="font-bold text-red-600">{formatCurrency(customer.arrears.totalArrears)}</span> untuk <span className="font-bold">{customer.arrears.totalMonths} bulan</span>.
              </p>
            </div>
            <Link href="/portal/tagihan">
              <button className="whitespace-nowrap px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95">
                Bayar Sekarang
              </button>
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Total Tunggakan"
            value={formatCurrency(customer.arrears?.totalArrears || 0)}
            subValue={`${customer.arrears?.totalMonths || 0} bulan outstanding`}
            icon={AlertCircle}
            color="red"
            delay={0}
          />
          <StatCard
            label="Tarif Bulanan"
            value={formatCurrency(customer.tarif?.harga_per_bulan || 0)}
            subValue={customer.tarif?.nama_kategori || '-'}
            icon={DollarSign}
            color="blue"
            delay={100}
          />
          <StatCard
            label="Total Dibayar"
            value={formatCurrency(customer.payments?.reduce((sum: number, p: any) => sum + p.jumlah_bayar, 0) || 0)}
            subValue={`${customer.payments?.length || 0} transaksi sukses`}
            icon={CheckCircle}
            color="emerald"
            delay={200}
          />
          <StatCard
            label="Status"
            value={customer.status}
            subValue={`Member sejak ${new Date(customer.tanggal_bergabung).getFullYear()}`}
            icon={User}
            color="purple"
            delay={300}
          />
        </div>

        {/* Main Content Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Recent Activity Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Aktivitas Terkini
              </h2>
              <Link href="/portal/riwayat" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                Lihat Semua <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              {recentPayments.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {recentPayments.map((payment: any) => {
                    const months = JSON.parse(payment.bulan_dibayar)
                    return (
                      <div key={payment.id} className="p-6 hover:bg-gray-50/50 transition-colors flex items-center gap-4 group">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-bold text-gray-900">Pembayaran Retribusi</p>
                            <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                              {formatCurrency(payment.jumlah_bayar)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                            {new Date(payment.tanggal_bayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            {months.length} Bulan
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <Clock className="w-8 h-8" />
                  </div>
                  <h3 className="text-gray-900 font-semibold mb-1">Belum ada aktivitas</h3>
                  <p className="text-sm text-gray-500">Transaksi pembayaran Anda akan muncul di sini.</p>
                </div>
              )}
            </div>

            {/* Quick Actions Grid for Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
              <Link href="/portal/tagihan">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform">
                  <CreditCard className="w-8 h-8 mb-4 opacity-80" />
                  <p className="font-bold text-lg mb-1">Bayar Tagihan</p>
                  <p className="text-emerald-100 text-sm">Cek detail tagihan Anda</p>
                </div>
              </Link>
              <Link href="/portal/riwayat">
                <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm active:scale-95 transition-transform">
                  <Clock className="w-8 h-8 mb-4 text-emerald-600" />
                  <p className="font-bold text-lg text-gray-900 mb-1">Riwayat</p>
                  <p className="text-gray-500 text-sm">Lihat arsip pembayaran</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Sidebar Info Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              Profil Saya
            </h2>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <User className="w-32 h-32" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-indigo-500/20">
                    {customer.nama?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{customer.nama}</h3>
                    <p className="text-sm text-gray-500">Pelanggan Tetap</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <InfoItem icon={MapPin} label="Alamat" value={customer.alamat} subValue={customer.wilayah} />
                  {customer.nomor_telepon && (
                    <InfoItem icon={Phone} label="Telepon" value={customer.nomor_telepon} />
                  )}
                  <InfoItem
                    icon={CreditCard}
                    label="Paket Aktif"
                    value={customer.tarif?.nama_kategori}
                    subValue={customer.tarif?.deskripsi}
                  />
                </div>
              </div>
            </div>

            {/* Desktop Quick Actions */}
            <div className="hidden lg:grid grid-cols-1 gap-4">
              <Link href="/portal/tagihan" className="group p-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl text-white shadow-lg shadow-emerald-500/20 hover:shadow-xl transition-all flex items-center justify-between">
                <div>
                  <p className="font-bold">Bayar Tagihan</p>
                  <p className="text-xs text-emerald-100">Cek & Lunasi Tunggakan</p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CreditCard className="w-5 h-5" />
                </div>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </PortalLayout>
  )
}

function StatCard({ label, value, subValue, icon: Icon, color, delay }: any) {
  const colors: any = {
    red: 'bg-red-50 text-red-600 border-red-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  }

  const iconColors: any = {
    red: 'bg-white text-red-600',
    blue: 'bg-white text-blue-600',
    emerald: 'bg-white text-emerald-600',
    purple: 'bg-white text-purple-600',
  }

  return (
    <div
      className={`rounded-3xl p-6 border transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${colors[color]} bg-opacity-40 backdrop-blur-sm`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${iconColors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {color === 'red' && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
      </div>
      <div>
        <p className="text-sm font-medium opacity-80 mb-1">{label}</p>
        <p className="text-2xl font-black mb-1 leading-tight tracking-tight">{value}</p>
        <p className="text-xs font-semibold opacity-70">{subValue}</p>
      </div>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value, subValue }: any) {
  return (
    <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
        {subValue && <p className="text-xs text-gray-500 mt-0.5">{subValue}</p>}
      </div>
    </div>
  )
}

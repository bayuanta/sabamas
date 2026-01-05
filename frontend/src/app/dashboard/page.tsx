'use client'

import AdminLayout from '@/components/AdminLayout'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi, customersApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import Button from '@/components/ui/Button'
import {
  TrendingUp,
  Users,
  AlertCircle,
  DollarSign,
  Calendar,
  Zap,
  CreditCard,
  Sun,
  Moon,
  Cloud,
  Wallet
} from 'lucide-react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts'
import StatCard from '@/components/ui/StatCard'
import QuickActions from '@/components/dashboard/QuickActions'

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false)
  /* State for Payment Stats Chart */
  const [paymentStatsYear, setPaymentStatsYear] = useState(new Date().getFullYear())

  /* State for Revenue Trend Chart */
  const [revenueYear, setRevenueYear] = useState(new Date().getFullYear())
  const [revenuePeriod, setRevenuePeriod] = useState<'day' | 'week' | 'month' | 'year'>('month')
  const [revenueStartDate, setRevenueStartDate] = useState('')
  const [revenueEndDate, setRevenueEndDate] = useState('')

  useEffect(() => {
    // Add small delay to ensure DOM is fully ready
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', paymentStatsYear, revenueYear],
    queryFn: async () => {
      try {
        const { data } = await reportsApi.getDashboard(paymentStatsYear, revenueYear)
        return data
      } catch (error) {
        // Let global interceptor handle 401s, but return null/empty here to not crash UI
        throw error
      }
    },
    // Don't retry on client errors (4xx) to avoid spamming the console
    retry: (failureCount, error: any) => {
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false
      }
      return failureCount < 3
    }
  })

  const { data: customersData } = useQuery({
    queryKey: ['customers-summary'],
    queryFn: async () => {
      const { data } = await customersApi.getAll({ limit: 100 })
      return data
    },
  })

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"
            />
            <p className="mt-4 text-muted-foreground">Memuat data...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // Get current hour for greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 18 ? 'Selamat Siang' : 'Selamat Malam'

  // Calculate annual revenue (selected year)
  // Use allPaymentsForYear if available, otherwise fallback (though backend should provide it)
  const annualRevenue = stats?.allPaymentsForYear
    ? stats.allPaymentsForYear
      .reduce((sum: number, payment: any) => sum + payment.jumlah_bayar, 0)
    : 0

  // Process monthly payment statistics (uses monthlyStats from backend, based on paymentStatsYear)
  const monthlyStats = stats?.monthlyStats || []

  // Process revenue statistics (uses allPaymentsForYear from backend, based on revenueYear)
  const revenueData = (() => {
    // allPaymentsForYear contains payments for revenueYear
    const sourcePayments = stats?.allPaymentsForYear || []
    if (!sourcePayments) return []

    let filteredPayments = sourcePayments

    // Apply custom date range filter if set
    if (revenueStartDate && revenueEndDate) {
      const startDate = new Date(revenueStartDate)
      const endDate = new Date(revenueEndDate)
      endDate.setHours(23, 59, 59, 999) // Include full end date

      filteredPayments = filteredPayments.filter((payment: any) => {
        const paymentDate = new Date(payment.tanggal_bayar)
        return paymentDate >= startDate && paymentDate <= endDate
      })
    }

    if (revenuePeriod === 'day') {
      // Group by day
      const dayMap = new Map<string, number>()

      filteredPayments.forEach((payment: any) => {
        const date = new Date(payment.tanggal_bayar)
        const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD
        const current = dayMap.get(dateKey) || 0
        dayMap.set(dateKey, current + Number(payment.jumlah_bayar || 0))
      })

      return Array.from(dayMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, revenue]) => ({
          period: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          pendapatan: revenue
        }))
    } else if (revenuePeriod === 'week') {
      // Group by week
      const weekMap = new Map<string, number>()

      filteredPayments.forEach((payment: any) => {
        const date = new Date(payment.tanggal_bayar)
        const year = date.getFullYear()
        const weekNum = Math.ceil((date.getDate() + new Date(year, date.getMonth(), 1).getDay()) / 7)
        const weekKey = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-W${weekNum}`
        const current = weekMap.get(weekKey) || 0
        weekMap.set(weekKey, current + Number(payment.jumlah_bayar || 0))
      })

      return Array.from(weekMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([week, revenue]) => ({
          period: `Minggu ${week.split('-W')[1]}`,
          pendapatan: revenue
        }))
    } else if (revenuePeriod === 'month') {
      // Group by month
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      const monthMap = new Map<number, number>()

      filteredPayments.forEach((payment: any) => {
        const date = new Date(payment.tanggal_bayar)
        // No need to check year here strictly as backend filters by revenueYear,
        // but safe to keep or remove. Keeping consistent logic.
        const month = date.getMonth()
        const current = monthMap.get(month) || 0
        monthMap.set(month, current + Number(payment.jumlah_bayar || 0))
      })

      return months.map((month, index) => ({
        period: month,
        pendapatan: monthMap.get(index) || 0
      }))
    } else {
      // Group by year
      const yearMap = new Map<number, number>()

      filteredPayments.forEach((payment: any) => {
        const date = new Date(payment.tanggal_bayar)
        const year = date.getFullYear()
        const current = yearMap.get(year) || 0
        yearMap.set(year, current + Number(payment.jumlah_bayar || 0))
      })

      return Array.from(yearMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([year, revenue]) => ({
          period: year.toString(),
          pendapatan: revenue
        }))
    }
  })()

  const statCards = [
    {
      value: stats?.pemasukanHariIni || 0,
      icon: DollarSign,
      gradient: 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-200',
      trend: { value: '12%', isPositive: true }
    },
    {
      title: 'Pemasukan Bulan Ini',
      value: stats?.pemasukanBulanIni || 0,
      icon: TrendingUp,
      gradient: 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-200',
      trend: { value: '8%', isPositive: true }
    },
    {
      title: 'Pendapatan 1 Tahun',
      value: annualRevenue,
      icon: Wallet,
      gradient: 'bg-gradient-to-br from-purple-400 to-purple-600 shadow-purple-200',
      trend: { value: '15%', isPositive: true }
    },
    {
      title: 'Total Tunggakan',
      value: stats?.totalTunggakan || 0,
      icon: AlertCircle,
      gradient: 'bg-gradient-to-br from-rose-400 to-rose-600 shadow-rose-200',
      trend: { value: '3%', isPositive: false }
    },
    {
      title: 'Total Pelanggan Aktif',
      value: stats?.totalCustomers || 0,
      icon: Users,
      gradient: 'bg-gradient-to-br from-violet-400 to-violet-600 shadow-violet-200',
      trend: { value: '5%', isPositive: true }
    },
  ]

  // Stat cards configuration complete

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Global style override for Recharts focus outlines */}
        <style jsx global>{`
          .recharts-wrapper *:focus {
            outline: none !important;
          }
          .recharts-surface:focus {
            outline: none !important;
          }
        `}</style>

        {/* Compact Lighter Welcome Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 shadow-lg shadow-blue-500/20">
          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-md shadow-sm">
                  {hour >= 5 && hour < 18 ? (
                    <Sun className="w-5 h-5 text-yellow-100 animate-spin-slow" />
                  ) : (
                    <Moon className="w-5 h-5 text-indigo-100" />
                  )}
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight text-shadow-sm">
                  {greeting}, Admin!
                </h1>
              </div>

              {/* Running Text Animation */}
              <div className="relative w-full overflow-hidden bg-white/20 rounded-lg py-1 px-3 backdrop-blur-md border border-white/20 shadow-inner">
                <motion.div
                  animate={{ x: ["100%", "-100%"] }}
                  transition={{
                    repeat: Infinity,
                    duration: 20,
                    ease: "linear",
                    repeatType: "loop"
                  }}
                  className="whitespace-nowrap flex items-center gap-8"
                >
                  <span className="text-sm font-medium text-white flex items-center gap-2">
                    <Zap className="w-3 h-3 text-yellow-200" /> Selamat datang di Dashboard SABAMAS
                  </span>
                  <span className="text-sm font-medium text-white/90">
                    • Pantau transaksi dan kelola pelanggan dengan mudah
                  </span>
                  <span className="text-sm font-medium text-white/90">
                    • Cek laporan harian Anda
                  </span>
                  <span className="text-sm font-medium text-white/90">
                    • Sistem berjalan normal
                  </span>
                </motion.div>
              </div>
            </div>

            <div className="hidden md:block flex-shrink-0">
              <div className="text-right px-4 py-1 border-l border-white/20">
                <p className="text-xs font-medium text-blue-50 uppercase tracking-wider">Hari ini</p>
                <p className="text-xl font-bold text-white leading-tight">
                  {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
          <QuickActions />
        </div>

        {/* Stats Cards */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistik</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {statCards.map((card, index) => (
              <StatCard
                key={`stat-${index}`}
                title={card.title ?? ''}
                value={typeof card.value === 'number' ? formatCurrency(card.value) : (card.value ?? '0')}
                icon={card.icon}
                gradient={card.gradient}
                trend={card.trend}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>

        {/* Monthly Payment Statistics Chart */}
        {monthlyStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Statistik Pembayaran Bulanan</h3>
                <p className="text-sm text-gray-500">Perbandingan tagihan dan pembayaran per bulan</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  id="payment-stats-year"
                  name="payment-stats-year"
                  value={paymentStatsYear}
                  onChange={(e) => setPaymentStatsYear(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  {Array.from({ length: 7 }, (_, i) => (new Date().getFullYear() + 2) - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="h-[400px] w-full" style={{ minHeight: '400px' }}>
              {isMounted && (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={monthlyStats}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#2563eb" />
                      </linearGradient>
                      <linearGradient id="unpaidGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f87171" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                      dataKey="month"
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      cursor={{ fill: '#f9fafb' }}
                      wrapperStyle={{ outline: 'none' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-xl">
                              <p className="text-sm font-bold text-gray-900 mb-2">{label}</p>
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-xs text-gray-500">Total Tagihan:</span>
                                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(data.totalTagihan)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span className="text-xs text-gray-500">Sudah Bayar:</span>
                                  </div>
                                  <span className="text-sm font-semibold text-blue-600">
                                    {formatCurrency(data.sudahBayar)} ({data.persentaseBayar}%)
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                                    <span className="text-xs text-gray-500">Belum Bayar:</span>
                                  </div>
                                  <span className="text-sm font-semibold text-rose-600">
                                    {formatCurrency(data.belumBayar)} ({100 - data.persentaseBayar}%)
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      content={({ payload }) => (
                        <div className="flex justify-center gap-6 mt-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-blue-500 to-blue-600" />
                            <span className="text-sm font-medium text-gray-600">Sudah Bayar</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-rose-400 to-rose-500" />
                            <span className="text-sm font-medium text-gray-600">Belum Bayar</span>
                          </div>
                        </div>
                      )}
                    />
                    <Bar
                      dataKey="belumBayar"
                      stackId="a"
                      fill="url(#unpaidGradient)"
                      radius={[0, 0, 0, 0]}
                      animationDuration={1500}
                      activeBar={false}
                      className="outline-none focus:outline-none"
                    />
                    <Bar
                      dataKey="sudahBayar"
                      stackId="a"
                      fill="url(#paidGradient)"
                      radius={[6, 6, 0, 0]}
                      animationDuration={1500}
                      activeBar={false}
                      className="outline-none focus:outline-none"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        )}

        {/* Monthly Revenue Line Chart */}
        {revenueData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
          >
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Tren Pendapatan</h3>
                  <p className="text-sm text-gray-500">Grafik pendapatan berdasarkan periode</p>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap items-end gap-3">
                {/* Year Selector */}
                <div className="flex-1 min-w-[100px]">
                  <label htmlFor="revenue-year" className="block text-xs font-medium text-gray-700 mb-1.5">Tahun</label>
                  <select
                    id="revenue-year"
                    value={revenueYear}
                    onChange={(e) => setRevenueYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                  >
                    {Array.from({ length: 7 }, (_, i) => (new Date().getFullYear() + 2) - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Period Type Selector */}
                <div className="flex-1 min-w-[150px]">
                  <label htmlFor="revenue-period" className="block text-xs font-medium text-gray-700 mb-1.5">Periode</label>
                  <select
                    id="revenue-period"
                    name="revenue-period"
                    value={revenuePeriod}
                    onChange={(e) => setRevenuePeriod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                  >
                    <option value="day">Per Hari</option>
                    <option value="week">Per Minggu</option>
                    <option value="month">Per Bulan</option>
                    <option value="year">Per Tahun</option>
                  </select>
                </div>

                {/* Start Date */}
                <div className="flex-1 min-w-[150px]">
                  <label htmlFor="revenue-start-date" className="block text-xs font-medium text-gray-700 mb-1.5">Dari Tanggal</label>
                  <input
                    type="date"
                    id="revenue-start-date"
                    name="revenue-start-date"
                    value={revenueStartDate}
                    onChange={(e) => setRevenueStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                  />
                </div>

                {/* End Date */}
                <div className="flex-1 min-w-[150px]">
                  <label htmlFor="revenue-end-date" className="block text-xs font-medium text-gray-700 mb-1.5">Sampai Tanggal</label>
                  <input
                    type="date"
                    id="revenue-end-date"
                    name="revenue-end-date"
                    value={revenueEndDate}
                    onChange={(e) => setRevenueEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                  />
                </div>

                {/* Reset Button */}
                {(revenueStartDate || revenueEndDate) && (
                  <button
                    onClick={() => {
                      setRevenueStartDate('')
                      setRevenueEndDate('')
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="h-[350px] w-full" style={{ minHeight: '350px' }}>
              {isMounted && (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart
                    data={revenueData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                      dataKey="period"
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      wrapperStyle={{ outline: 'none' }}
                      cursor={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5 5' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-xl">
                              <p className="text-sm font-bold text-gray-900 mb-2">{label}</p>
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <span className="text-xs text-gray-500">Pendapatan:</span>
                                </div>
                                <span className="text-sm font-semibold text-emerald-600">
                                  {formatCurrency(payload[0].value as number)}
                                </span>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pendapatan"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
                      fill="url(#revenueGradient)"
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        )}

        {/* Recent Payments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Transaksi Terbaru</h2>
            <Button variant="ghost" className="text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
              Lihat Semua
            </Button>
          </div>
          <div className="p-0">
            {stats?.recentPayments && stats.recentPayments.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {stats.recentPayments.slice(0, 5).map((payment: any, index: number) => {
                  let months: any[] = []
                  try {
                    const parsed = JSON.parse(payment.bulan_dibayar)
                    if (Array.isArray(parsed)) months = parsed
                  } catch (e) { }

                  let isPartial = false
                  try {
                    if (payment.month_breakdown) {
                      const breakdown = JSON.parse(payment.month_breakdown)
                      if (breakdown && typeof breakdown === 'object') {
                        const values = Object.values(breakdown) as any[]
                        // Detect if any entry is related to installment/cicilan
                        if (values.some(v => v?.source === 'history' || (v?.details && typeof v.details === 'string' && v.details.toLowerCase().includes('cicilan')))) {
                          isPartial = true
                        }
                      }
                    }
                  } catch (e) { }

                  return (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors group cursor-default"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-indigo-600 font-bold text-sm shadow-sm border border-indigo-100/50 group-hover:scale-105 transition-transform">
                          {payment.customer_nama.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">
                            {payment.customer_nama}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {isPartial ? (
                              <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                Cicilan
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                {months.length} Bulan
                              </span>
                            )}
                            <span className="text-gray-300 text-[10px]">|</span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(payment.tanggal_bayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {new Date(payment.tanggal_bayar).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-gray-900 text-sm mb-1">{formatCurrency(payment.jumlah_bayar)}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${payment.metode_bayar === 'tunai'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-blue-50 text-blue-600 border border-blue-100'
                          }`}>
                          {payment.metode_bayar === 'tunai' ? 'Tunai' : 'Transfer'}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-block p-4 bg-gray-50 rounded-full mb-3">
                  <DollarSign className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-900 font-medium">Belum ada transaksi</p>
                <p className="text-sm text-gray-500 mt-1">Transaksi yang masuk akan muncul di sini</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Methods Chart */}
          {(() => {
            // Determine data source for chart:
            // 1. Prefer allPaymentsForYear if available.
            // 2. Fallback to recentPayments if Year data is empty (e.g. new year with no data yet)
            let chartSource = stats?.allPaymentsForYear || []
            let chartTitle = `Tahun ${revenueYear}`
            let usingYearData = true

            // Fallback logic
            if (chartSource.length === 0 && stats?.recentPayments?.length > 0) {
              chartSource = stats.recentPayments
              chartTitle = '10 Transaksi Terakhir'
              usingYearData = false
            }

            // Group by method (Tunai & Transfer only) - ignore others
            const methodCounts = {
              'Tunai': 0,
              'Transfer': 0
            }

            let validTransCount = 0
            chartSource.forEach((p: any) => {
              const rawMethod = (p.metode_bayar || '').toLowerCase().trim()

              if (rawMethod.includes('tunai') || rawMethod.includes('cash')) {
                methodCounts['Tunai']++
                validTransCount++
              } else if (rawMethod.includes('transfer') || rawMethod.includes('bank') || rawMethod.includes('qris')) {
                methodCounts['Transfer']++
                validTransCount++
              }
            })

            const chartData = [
              { name: 'Tunai', value: methodCounts['Tunai'], color: '#10b981' },
              { name: 'Transfer', value: methodCounts['Transfer'], color: '#3b82f6' }
            ]

            const totalCount = chartSource.length
            // Show diagram if we have ANY entries (even 0 value ones, so legend appears)
            const hasData = true

            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Metode Pembayaran</h3>
                    <p className="text-sm text-gray-500">Perbandingan metode pembayaran ({chartTitle})</p>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>

                <div className="relative h-[300px] w-full" style={{ minHeight: '300px' }}>
                  {isMounted && hasData ? (
                    <>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          {/* Background Ring for Empty State Visual */}
                          <Pie
                            data={[{ value: 1 }]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            dataKey="value"
                            strokeWidth={0}
                            fill="#f3f4f6"
                            isAnimationActive={false}
                            tooltipType="none"
                          />
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            wrapperStyle={{ outline: 'none' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                if (!data.name) return null; // Skip tooltip for background ring
                                return (
                                  <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                                      <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">{data.name}</span>
                                    </div>
                                    <p className="text-xl font-bold text-gray-900">
                                      {data.value} <span className="text-sm font-normal text-gray-400">Transaksi</span>
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            content={({ payload }) => (
                              <div className="flex justify-center gap-6 mt-4 flex-wrap">
                                {chartData.map((entry: any, index: number) => (
                                  <div key={`legend-${index}`} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-sm font-medium text-gray-600">
                                      {entry.name} <span className="text-gray-400 font-normal">({entry.value})</span>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      {/* Center Text Decoration */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                        <div className="text-center">
                          <p className="text-sm text-gray-400 font-medium">Total</p>
                          <p className="text-2xl font-bold text-gray-900">{validTransCount}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-70">
                      <div className="p-4 bg-gray-50 rounded-full mb-3">
                        <CreditCard className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-900 font-medium">Belum ada data</p>
                      <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
                        Belum ada transaksi yang tercatat untuk {chartTitle}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })()}

          {/* Customers by Wilayah */}
          {(stats?.wilayahStats || customersData?.data) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Pelanggan per Wilayah</h3>
                  <p className="text-sm text-gray-500">Distribusi pelanggan aktif berdasarkan lokasi</p>
                </div>
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
              </div>

              <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
                {isMounted && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={stats?.wilayahStats || Object.entries(
                        customersData?.data?.reduce((acc: any, customer: any) => {
                          acc[customer.wilayah] = (acc[customer.wilayah] || 0) + 1
                          return acc
                        }, {}) || {}
                      ).map(([wilayah, count]) => ({ wilayah, count }))}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis
                        dataKey="wilayah"
                        stroke="#9ca3af"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: '#f9fafb' }}
                        wrapperStyle={{ outline: 'none' }}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1">{label}</p>
                                <p className="text-xl font-bold text-indigo-600">
                                  {payload[0].value} <span className="text-sm font-normal text-gray-400">Pelanggan</span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="url(#barGradient)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={60}
                        animationDuration={1500}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

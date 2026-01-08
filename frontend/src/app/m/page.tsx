'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/lib/api'
import MobileHeader from '@/components/mobile/MobileHeader'
import { formatCurrency } from '@/lib/utils'
import {
    TrendingUp,
    Users,
    Receipt,
    AlertCircle,
    ArrowRight,
    DollarSign,
    Calendar,
    Wallet,
    BarChart3,
    CreditCard
} from 'lucide-react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts'

export default function MobileDashboard() {
    const router = useRouter()
    const [token, setToken] = useState<string | null>(null)
    const [paymentStatsYear, setPaymentStatsYear] = useState(new Date().getFullYear())
    const [revenueYear, setRevenueYear] = useState(new Date().getFullYear())
    const [revenuePeriod, setRevenuePeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
    const [isMounted, setIsMounted] = useState(false)
    const [chartWidth, setChartWidth] = useState(0)

    // Check authentication & Mount status & Window Width
    useEffect(() => {
        setIsMounted(true)

        const handleResize = () => {
            // Calculate width based on typical padding (e.g., container padding 16px * 2 = 32, card padding 20px * 2 = 40 => ~72px total horizontal padding)
            // Using 80 for safety margin
            if (typeof window !== 'undefined') {
                setChartWidth(window.innerWidth - 80)
            }
        }

        handleResize()
        window.addEventListener('resize', handleResize)

        const storedToken = localStorage.getItem('token')
        if (!storedToken) {
            console.log('DEBUG: Token missing in m/page.tsx')
        } else {
            setToken(storedToken)
        }

        return () => window.removeEventListener('resize', handleResize)
    }, [router])

    // Fetch dashboard stats
    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats', paymentStatsYear, revenueYear],
        queryFn: async () => {
            const { data } = await reportsApi.getDashboard(paymentStatsYear, revenueYear)
            return data
        },
    })

    // Calculate annual revenue
    const annualRevenue = stats?.allPaymentsForYear
        ? stats.allPaymentsForYear
            .reduce((sum: number, payment: any) => sum + payment.jumlah_bayar, 0)
        : 0

    // Process monthly payment statistics (uses monthlyStats from backend)
    const monthlyStats = stats?.monthlyStats || []

    // Transform monthlyStats for Chart: limit to last 6 months or simplify labels if needed
    const chartData = monthlyStats.map((item: any) => ({
        name: item.month.substring(0, 3), // Jan, Feb...
        paid: item.sudahBayar,
        unpaid: item.belumBayar,
        totalTagihan: item.totalTagihan
    }))

    // Process revenue trend data
    const revenueData = (() => {
        const sourcePayments = stats?.allPaymentsForYear || []

        if (revenuePeriod === 'daily') {
            // Harian: 7 hari terakhir
            const days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date()
                d.setDate(d.getDate() - (6 - i)) // Get last 7 days including today
                return d
            })

            return days.map(day => {
                const dateStr = day.toISOString().split('T')[0] // YYYY-MM-DD
                const dayRevenue = sourcePayments
                    .filter((p: any) => p.tanggal_bayar && p.tanggal_bayar.startsWith(dateStr))
                    .reduce((acc: number, curr: any) => acc + Number(curr.jumlah_bayar || 0), 0)

                return {
                    name: day.toLocaleDateString('id-ID', { weekday: 'short' }), // Sen, Sel...
                    fullDate: dateStr,
                    pendapatan: dayRevenue
                }
            })

        } else if (revenuePeriod === 'weekly') {
            // Mingguan: Group by week number within the selected revenueYear
            const weekMap = new Map<number, number>()
            const weeksInYear = 52 // Max weeks in a year

            // Initialize weeks for the year
            for (let i = 1; i <= weeksInYear; i++) {
                weekMap.set(i, 0)
            }

            sourcePayments.forEach((payment: any) => {
                const date = new Date(payment.tanggal_bayar)
                // Check if the payment date is within the selected revenueYear
                if (date.getFullYear() === revenueYear) {
                    // Calculate week number of the year (ISO week date system)
                    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
                    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

                    const current = weekMap.get(weekNo) || 0
                    weekMap.set(weekNo, current + Number(payment.jumlah_bayar || 0))
                }
            })

            // Filter out weeks with no data and format
            return Array.from(weekMap.entries())
                .filter(([, value]) => value > 0) // Only show weeks with actual revenue
                .sort((a, b) => a[0] - b[0])
                .map(([week, val]) => ({
                    name: `Mgg ${week}`,
                    pendapatan: val
                }))

        } else if (revenuePeriod === 'yearly') {
            // Tahunan: Sum for the selected revenueYear
            const yearRevenue = sourcePayments.reduce((acc: number, curr: any) => acc + Number(curr.jumlah_bayar || 0), 0)
            return [{
                name: String(revenueYear),
                pendapatan: yearRevenue
            }]
        }

        // Default: Monthly (Jan - Des)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
        const monthMap = new Map<number, number>()

        sourcePayments.forEach((payment: any) => {
            const date = new Date(payment.tanggal_bayar)
            const month = date.getMonth()
            const current = monthMap.get(month) || 0
            monthMap.set(month, current + Number(payment.jumlah_bayar || 0))
        })

        return months.map((month, index) => ({
            name: month,
            pendapatan: monthMap.get(index) || 0
        })).filter(d => true) // Keep all months for trend
    })()

    const statCards = [
        {
            id: 'income-today',
            label: 'Pemasukan Hari Ini',
            value: formatCurrency(stats?.pemasukanHariIni || 0),
            icon: DollarSign,
            gradient: 'from-emerald-400 to-emerald-600',
            shadow: 'shadow-emerald-200',
        },
        {
            id: 'income-month',
            label: 'Pemasukan Bulan Ini',
            value: formatCurrency(stats?.pemasukanBulanIni || 0),
            icon: TrendingUp,
            gradient: 'from-blue-400 to-blue-600',
            shadow: 'shadow-blue-200',
        },
        {
            id: 'income-year',
            label: 'Pendapatan 1 Tahun',
            value: formatCurrency(annualRevenue),
            icon: Wallet,
            gradient: 'from-purple-400 to-purple-600',
            shadow: 'shadow-purple-200',
            colSpan: true // Make full width
        },
        {
            id: 'transactions-today',
            label: 'Transaksi Hari Ini',
            value: stats?.wargaBayarHariIni || 0,
            icon: Receipt,
            gradient: 'from-indigo-400 to-indigo-600',
            shadow: 'shadow-indigo-200',
        },
        {
            id: 'arrears',
            label: 'Total Tunggakan',
            value: formatCurrency(stats?.totalTunggakan || 0),
            icon: AlertCircle,
            gradient: 'from-rose-400 to-rose-600',
            shadow: 'shadow-rose-200',
        },
    ]

    // Generate years for filter (last 5 years)
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-100 border-t-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Global styles override for Recharts outline */}
            <style jsx global>{`
                .recharts-wrapper, 
                .recharts-surface, 
                .recharts-cartesian-grid-vertical, 
                .recharts-cartesian-grid-horizontal, 
                .recharts-sector, 
                .recharts-rectangle, 
                .recharts-responsive-container {
                    outline: none !important;
                    -webkit-tap-highlight-color: transparent !important;
                }
                *:focus {
                    outline: none !important;
                }
            `}</style>

            <MobileHeader title="Dashboard" />

            <div className="p-4 space-y-6">
                {/* Welcome Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-indigo-200"
                >
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>

                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-indigo-100 text-sm mb-1 font-medium">Selamat Datang</p>
                            <h2 className="text-2xl font-bold tracking-tight">Admin Sabamas</h2>
                        </div>
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="relative z-10 mt-6 flex items-center text-xs font-medium text-indigo-100 bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm">
                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                        {new Date().toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                </motion.div>

                {/* Modern Stat Grid */}
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 ml-1">Ringkasan Keuangan</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {statCards.map((card, index) => {
                            const Icon = card.icon
                            return (
                                <motion.div
                                    key={card.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`relative overflow-hidden rounded-2xl p-4 shadow-lg ${card.colSpan ? 'col-span-2' : ''} bg-white`}
                                >
                                    <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${card.gradient} opacity-10 rounded-bl-full`}></div>

                                    <div className="flex items-start justify-between mb-2">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-md`}>
                                            <Icon className="w-5 h-5 text-white" />
                                        </div>
                                    </div>

                                    <p className="text-xs font-medium text-gray-500 mb-0.5">{card.label}</p>
                                    <p className="text-lg font-bold text-gray-900 tracking-tight">
                                        {card.value}
                                    </p>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>

                {/* Charts Section */}
                <div className="space-y-4">
                    {/* Revenue Trend Chart */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-gray-900 flex items-center">
                                    <TrendingUp className="w-4 h-4 mr-2 text-indigo-500" />
                                    Tren Pendapatan
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={revenuePeriod}
                                    onChange={(e) => setRevenuePeriod(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                                    className="text-xs border-none bg-gray-50 rounded-lg px-2 py-1 font-bold text-gray-600 focus:ring-0"
                                >
                                    <option value="daily">Harian</option>
                                    <option value="weekly">Mingguan</option>
                                    <option value="monthly">Bulanan</option>
                                    <option value="yearly">Tahunan</option>
                                </select>
                                <select
                                    value={revenueYear}
                                    onChange={(e) => setRevenueYear(Number(e.target.value))}
                                    className="text-xs border-none bg-gray-50 rounded-lg px-2 py-1 font-bold text-gray-600 focus:ring-0"
                                >
                                    {years.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div
                            className="flex justify-center overflow-hidden"
                        // style prop removed in favor of global style block for better coverage
                        >
                            {isMounted && chartWidth > 0 && (
                                <AreaChart width={chartWidth} height={220} data={revenueData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    {/* XAxis hidden as requested, but with padding added */}
                                    <XAxis
                                        dataKey="name"
                                        tick={false}
                                        axisLine={false}
                                        tickLine={false}
                                        padding={{ left: 20, right: 10 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                                        cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '4 4' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="pendapatan"
                                        stroke="#6366f1"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
                                    />
                                </AreaChart>
                            )}
                        </div>
                    </div>

                    {/* Monthly Payment Chart */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-gray-900 flex items-center">
                                    <BarChart3 className="w-4 h-4 mr-2 text-emerald-500" />
                                    Statistik Bayar
                                </h3>
                            </div>
                            <select
                                value={paymentStatsYear}
                                onChange={(e) => setPaymentStatsYear(Number(e.target.value))}
                                className="text-xs border-none bg-gray-50 rounded-lg px-2 py-1 font-bold text-gray-600 focus:ring-0"
                            >
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                        <div
                            className="flex justify-center overflow-hidden"
                        // style prop removed in favor of global style block for better coverage
                        >
                            {isMounted && chartWidth > 0 && (
                                <BarChart width={chartWidth} height={220} data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#64748b' }}
                                        interval={0}
                                        dy={10}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload
                                                return (
                                                    <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
                                                        <p className="text-xs font-bold text-gray-900 mb-2">{label}</p>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <span className="text-[10px] text-gray-500">Total Tagihan:</span>
                                                                <span className="text-xs font-bold text-gray-900">{formatCurrency(data.totalTagihan)}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div className="flex items-center gap-1">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                    <span className="text-[10px] text-gray-500">Lunas:</span>
                                                                </div>
                                                                <span className="text-xs font-bold text-emerald-600">{formatCurrency(data.paid)}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div className="flex items-center gap-1">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                                    <span className="text-[10px] text-gray-500">Tunggakan:</span>
                                                                </div>
                                                                <span className="text-xs font-bold text-rose-600">{formatCurrency(data.unpaid)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                            return null
                                        }}
                                    />
                                    <Bar dataKey="unpaid" name="Tunggakan" stackId="a" fill="#f43f5e" radius={[0, 0, 0, 0]} barSize={12} />
                                    <Bar dataKey="paid" name="Lunas" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                                </BarChart>
                            )}
                        </div>
                    </div>
                </div>


                {/* Quick Actions Grid */}
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 ml-1">Menu Cepat</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => router.push('/m/billing')}
                            className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 active:scale-95 transition-all"
                        >
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-2 text-indigo-600">
                                <Receipt className="w-6 h-6" />
                            </div>
                            <span className="font-semibold text-gray-900 text-sm">Input Bayar</span>
                        </button>

                        <button
                            onClick={() => router.push('/m/customers')}
                            className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 active:scale-95 transition-all"
                        >
                            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-2 text-purple-600">
                                <Users className="w-6 h-6" />
                            </div>
                            <span className="font-semibold text-gray-900 text-sm">Pelanggan</span>
                        </button>
                    </div>
                </div>

                {/* Recent Transactions */}
                {stats?.recentPayments && stats.recentPayments.length > 0 && (
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Transaksi Terbaru</h3>
                            <button
                                onClick={() => router.push('/m/transactions')}
                                className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full"
                            >
                                Lihat Semua
                            </button>
                        </div>
                        <div className="space-y-4">
                            {stats.recentPayments.slice(0, 5).map((payment: any) => (
                                <div
                                    key={payment.id}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${payment.metode_bayar === 'transfer' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                                            }`}>
                                            {payment.metode_bayar === 'transfer' ? <CreditCard className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">
                                                {payment.customer?.nama || payment.customer_nama}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(payment.tanggal_bayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {payment.metode_bayar}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-gray-900 text-sm">
                                        {formatCurrency(payment.jumlah_bayar)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

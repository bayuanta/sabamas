'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi, paymentsApi } from '@/lib/api'
import MobileHeader from '@/components/mobile/MobileHeader'
import { formatCurrency } from '@/lib/utils'
import { Search, Check, Wallet, CreditCard, User, Calendar, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

function MobileBillingContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const queryClient = useQueryClient()

    // State
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    // Payment State
    const [selectedMonths, setSelectedMonths] = useState<string[]>([])
    const [paymentMethod, setPaymentMethod] = useState<'tunai' | 'transfer'>('tunai')
    const [showFutureMonths, setShowFutureMonths] = useState(false)

    // Partial Payment State
    const [isPartialMode, setIsPartialMode] = useState(false)
    const [partialAmount, setPartialAmount] = useState<string>('')

    // Initialize from URL param
    useEffect(() => {
        const customerId = searchParams.get('customerId')
        if (customerId) {
            setSelectedCustomerId(customerId)
        }
    }, [searchParams])

    // Fetch Customer Details
    const { data: customer, isLoading: isLoadingCustomer } = useQuery({
        queryKey: ['customer', selectedCustomerId],
        queryFn: async () => {
            if (!selectedCustomerId) return null
            const { data } = await customersApi.getOne(selectedCustomerId)
            return data
        },
        enabled: !!selectedCustomerId
    })

    // Fetch Partial Payments (for checking paid status logic if needed, matches Web)
    const { data: partialPayments } = useQuery({
        queryKey: ['partial-payments', selectedCustomerId],
        queryFn: async () => {
            if (!selectedCustomerId) return []
            const { data } = await paymentsApi.getPartialPayments(selectedCustomerId)
            return data
        },
        enabled: !!selectedCustomerId
    })

    // Helpers from Web Version
    const formatMonthString = (date: Date): string => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        return `${year}-${month}`
    }

    const parseMonthString = (monthStr: string): Date => {
        const [year, month] = monthStr.split('-').map(Number)
        return new Date(year, month - 1, 1)
    }

    const isFutureMonth = (month: string): boolean => {
        const monthDate = parseMonthString(month)
        const now = new Date()
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        return monthDate > currentMonth
    }

    // Generate Future Months Logic (Next 12)
    const getFutureMonths = (): string[] => {
        const months: string[] = []
        const now = new Date()

        // Get paid months set from customer payments history
        const paidMonths = new Set<string>()
        if (customer?.payments) {
            customer.payments.forEach((p: any) => {
                if (p.bulan_dibayar) {
                    try {
                        const list = typeof p.bulan_dibayar === 'string' ? JSON.parse(p.bulan_dibayar) : p.bulan_dibayar
                        if (Array.isArray(list)) list.forEach((m: string) => paidMonths.add(m))
                    } catch (e) {
                        // ignore
                    }
                }
            })
        }

        for (let i = 1; i <= 12; i++) {
            const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
            const monthStr = formatMonthString(futureDate)
            // Also check arrear months to avoid duplication if arrear is technically in future (rare but safe)
            const isArrear = customer?.arrears?.arrearMonths?.some((a: any) => a.month === monthStr)

            if (!paidMonths.has(monthStr) && !isArrear) {
                months.push(monthStr)
            }
        }
        return months
    }

    // Prepare Data Lists
    const arrearMonths = customer?.arrears?.arrearMonths || []
    const futureMonths = customer ? getFutureMonths() : []

    // Calculate Total
    const calculateTotal = () => {
        if (!customer) return 0
        let total = 0

        selectedMonths.forEach(month => {
            // Check if it's an arrear
            const arrear = arrearMonths.find((a: any) => a.month === month)
            // Check if it's a partial payment
            const partial = partialPayments?.find((p: any) => p.bulan_tagihan === month && p.status === 'cicilan')

            if (partial) {
                total += partial.sisa_tagihan
            } else if (arrear) {
                total += arrear.amount
            } else {
                // Future month uses current tariff
                total += customer.tarif?.harga_per_bulan || 0
            }
        })
        return total
    }

    const totalAmount = calculateTotal()
    const finalPaymentAmount = isPartialMode && partialAmount ? parseFloat(partialAmount) : totalAmount

    // Mutation
    const createPaymentMutation = useMutation({
        mutationFn: (data: any) => paymentsApi.create(data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
            queryClient.invalidateQueries({ queryKey: ['customers'] })
            queryClient.invalidateQueries({ queryKey: ['customer', selectedCustomerId] }) // Refresh details
            queryClient.invalidateQueries({ queryKey: ['partial-payments'] })

            // Reset state
            setPartialAmount('')
            setIsPartialMode(false)
            setSelectedMonths([])

            // Redirect to Receipt Page
            router.push(`/m/billing/receipt/${response.data.id}`)
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Gagal memproses pembayaran')
        }
    })

    const handlePay = () => {
        if (!selectedCustomerId || selectedMonths.length === 0) return

        // Validate Partial
        if (isPartialMode) {
            const amount = parseFloat(partialAmount)
            if (isNaN(amount) || amount <= 0) {
                alert('Masukkan nominal pembayaran yang valid')
                return
            }
            if (amount > totalAmount) {
                alert('Nominal cicilan tidak boleh melebihi total tagihan')
                return
            }
        }

        createPaymentMutation.mutate({
            customer_id: selectedCustomerId,
            bulan_dibayar: selectedMonths,
            jumlah_bayar: finalPaymentAmount,
            metode_bayar: paymentMethod,
            is_partial: isPartialMode
        })
    }



    // Toggle Selection
    const toggleMonth = (month: string) => {
        if (selectedMonths.includes(month)) {
            setSelectedMonths(selectedMonths.filter(m => m !== month))
        } else {
            setSelectedMonths([...selectedMonths, month])
        }
    }

    // --- Search Mode ---
    if (!selectedCustomerId) {
        return (
            <div className="min-h-screen bg-gray-50">
                <MobileHeader title="Input Pembayaran" showBack />
                <div className="p-4">
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            autoFocus
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari pelanggan..."
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                    </div>
                    <CustomerSearchResults
                        query={searchQuery}
                        onSelect={(id) => {
                            setSelectedCustomerId(id)
                            setSearchQuery('')
                        }}
                    />
                </div>
            </div>
        )
    }

    if (isLoadingCustomer) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    // --- Billing Mode ---
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <MobileHeader
                title="Tagihan"
                showBack
                onBack={() => {
                    setSelectedCustomerId(null)
                    setSelectedMonths([])
                }}
            />

            {/* Increased bottom padding to 96 (24rem) to accommodate taller action bar */}
            <div className="flex-1 overflow-y-auto pb-96">
                {/* Customer Info */}
                <div className="bg-white p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                            {customer?.nama.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{customer?.nama}</h2>
                            <p className="text-gray-500 text-sm">{customer?.wilayah} • {customer?.nomor_pelanggan}</p>
                        </div>
                    </div>
                </div>

                {/* Lists Container */}
                <div className="p-4 space-y-6">

                    {/* 1. Arrears List */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
                            Tagihan Belum Dibayar
                        </h3>

                        {arrearMonths.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2">
                                {arrearMonths.map((item: any) => {
                                    const isSelected = selectedMonths.includes(item.month)
                                    return (
                                        <div
                                            key={item.month}
                                            onClick={() => toggleMonth(item.month)}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${isSelected
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-gray-100 bg-white'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'
                                                    }`}>
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">
                                                        {format(parseMonthString(item.month), 'MMMM yyyy', { locale: idLocale })}
                                                    </p>
                                                    <p className="text-xs text-red-500 font-medium">Belum Lunas</p>
                                                </div>
                                            </div>
                                            <p className="font-bold text-gray-900">{formatCurrency(item.amount)}</p>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="bg-white p-6 rounded-xl border border-gray-100 text-center">
                                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Check className="w-6 h-6 text-green-500" />
                                </div>
                                <p className="text-gray-900 font-medium">Semua Tagihan Lunas</p>
                            </div>
                        )}
                    </div>

                    {/* 1b. Active Partial Payments/Cicilan */}
                    {partialPayments && partialPayments.filter((p: any) => p.status === 'cicilan').length > 0 && (
                        <div>
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                                <Wallet className="w-5 h-5 mr-2 text-orange-500" />
                                Pembayaran Cicilan
                            </h3>
                            <div className="grid grid-cols-1 gap-2">
                                {partialPayments.filter((p: any) => p.status === 'cicilan').map((p: any) => {
                                    const isSelected = selectedMonths.includes(p.bulan_tagihan)
                                    const progress = (p.jumlah_terbayar / p.jumlah_tagihan) * 100

                                    return (
                                        <div
                                            key={p.id}
                                            onClick={() => toggleMonth(p.bulan_tagihan)}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                                                ? 'border-orange-500 bg-orange-50'
                                                : 'border-orange-100 bg-white'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                                                        }`}>
                                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">
                                                            {format(parseMonthString(p.bulan_tagihan), 'MMMM yyyy', { locale: idLocale })}
                                                        </p>
                                                        <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold uppercase">
                                                            Cicilan ke-{p.payment_ids ? p.payment_ids.length : 1}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500">Sisa</p>
                                                    <p className="font-bold text-red-600">{formatCurrency(p.sisa_tagihan)}</p>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mt-2">
                                                <div
                                                    className="h-full bg-orange-500"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-1 text-right">
                                                Terbayar: {formatCurrency(p.jumlah_terbayar)} ({Math.round(progress)}%)
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* 2. Future Months Toggle */}
                    <div className="border-t border-gray-100 pt-4">
                        <button
                            onClick={() => setShowFutureMonths(!showFutureMonths)}
                            className="flex items-center justify-between w-full p-2 text-indigo-600 font-medium"
                        >
                            <span className="flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Bayar Dimuka (Next 12 Bulan)
                            </span>
                            <span className="text-xs bg-indigo-50 px-2 py-1 rounded-lg">
                                {showFutureMonths ? 'Sembunyikan' : 'Tampilkan'}
                            </span>
                        </button>

                        <AnimatePresence>
                            {showFutureMonths && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden mt-3"
                                >
                                    <div className="grid grid-cols-1 gap-2">
                                        {futureMonths.map((month) => {
                                            const isSelected = selectedMonths.includes(month)
                                            const tariff = customer?.tarif?.harga_per_bulan || 0
                                            return (
                                                <div
                                                    key={month}
                                                    onClick={() => toggleMonth(month)}
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${isSelected
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-100 bg-white'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                                                            }`}>
                                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900">
                                                                {format(parseMonthString(month), 'MMMM yyyy', { locale: idLocale })}
                                                            </p>
                                                            <p className="text-xs text-blue-500">Bayar Dimuka</p>
                                                        </div>
                                                    </div>
                                                    <p className="font-bold text-gray-900">{formatCurrency(tariff)}</p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Payment Method */}
                    <div className="pt-4">
                        <h3 className="font-bold text-gray-900 mb-3">Metode Pembayaran</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setPaymentMethod('tunai')}
                                className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === 'tunai'
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                    : 'border-gray-100 bg-white text-gray-500'
                                    }`}
                            >
                                <Wallet className="w-5 h-5 mr-2" />
                                <span className="font-semibold">Tunai</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod('transfer')}
                                className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === 'transfer'
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                    : 'border-gray-100 bg-white text-gray-500'
                                    }`}
                            >
                                <CreditCard className="w-5 h-5 mr-2" />
                                <span className="font-semibold">Transfer</span>
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom Action Bar */}
            {/* Raised bottom position to clear the Mobile Bottom Navigation Menu */}
            <div className="fixed bottom-[75px] left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] z-30">
                <div className="max-w-screen-xl mx-auto space-y-4">
                    {/* Partial Mode Toggle */}
                    {selectedMonths.length > 0 && (
                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-800 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isPartialMode}
                                        onChange={(e) => {
                                            setIsPartialMode(e.target.checked)
                                            if (!e.target.checked) setPartialAmount('')
                                        }}
                                        className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                                    />
                                    Mode Bayar Cicilan (Partial)
                                </label>
                            </div>

                            {isPartialMode && (
                                <div className="mt-3 animate-fadeIn">
                                    <p className="text-xs text-gray-500 mb-1">Nominal Pembayaran (Rp)</p>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                                        <input
                                            type="number"
                                            value={partialAmount}
                                            onChange={(e) => setPartialAmount(e.target.value)}
                                            placeholder="0"
                                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-bold text-gray-900"
                                        />
                                    </div>
                                    <p className="text-[10px] text-orange-600 mt-1">
                                        *Sisa {formatCurrency(Math.max(0, totalAmount - (parseFloat(partialAmount) || 0)))} akan menjadi tunggakan
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-gray-500">Total Tagihan</p>
                            <p className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700`}>
                                {formatCurrency(finalPaymentAmount)}
                            </p>
                            {isPartialMode && (
                                <p className="text-xs text-gray-400 line-through">{formatCurrency(totalAmount)}</p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">{selectedMonths.length} bulan dipilih</p>
                        </div>
                    </div>

                    <button
                        onClick={handlePay}
                        disabled={selectedMonths.length === 0 || createPaymentMutation.isPending || (isPartialMode && (!partialAmount || parseFloat(partialAmount) <= 0))}
                        className={`w-full font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${isPartialMode
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                            }`}
                    >
                        {createPaymentMutation.isPending ? 'Memproses...' : isPartialMode ? 'Bayar Cicilan' : 'Bayar Penuh'}
                    </button>
                </div>
            </div>


        </div>
    )
}

export default function MobileBilling() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        }>
            <MobileBillingContent />
        </Suspense>
    )
}

function CustomerSearchResults({ query, onSelect }: { query: string, onSelect: (id: string) => void }) {
    const { data: searchResult, isLoading } = useQuery({
        queryKey: ['customers-search', query],
        queryFn: async () => {
            if (!query) return { data: [] }
            const { data } = await customersApi.getAll({ search: query, limit: 10 })
            return data
        },
        enabled: query.length > 2
    })

    if (query.length <= 2) {
        return <p className="text-center text-gray-400 mt-10">Ketik minimal 3 huruf untuk mencari</p>
    }

    if (isLoading) {
        return <div className="text-center mt-10"><div className="animate-spin inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full"></div></div>
    }

    const customers = searchResult?.data || []

    if (!Array.isArray(customers) || customers.length === 0) {
        return <p className="text-center text-gray-400 mt-10">Tidak ditemukan</p>
    }

    return (
        <div className="space-y-2">
            {customers.map((c: any) => (
                <button
                    key={c.id}
                    onClick={() => onSelect(c.id)}
                    className="w-full text-left p-4 bg-white border border-gray-100 rounded-xl shadow-sm active:bg-gray-50 transition-colors"
                >
                    <p className="font-bold text-gray-900">{c.nama}</p>
                    <div className="flex justify-between mt-1">
                        <p className="text-sm text-gray-500">{c.wilayah}</p>
                        <p className="text-xs text-gray-400 font-mono">{c.nomor_pelanggan}</p>
                    </div>
                    {c.arrears?.totalArrears > 0 && (
                        <div className="mt-2 text-xs font-bold text-red-600 bg-red-50 inline-block px-2 py-1 rounded">
                            Tunggakan: {formatCurrency(c.arrears.totalArrears)}
                        </div>
                    )}
                </button>
            ))}
        </div>
    )
}

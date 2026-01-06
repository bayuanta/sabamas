'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi, paymentsApi, tariffsApi } from '@/lib/api'
import MobileHeader from '@/components/mobile/MobileHeader'
import { formatCurrency } from '@/lib/utils'
import { Search, Check, Wallet, CreditCard, ChevronDown, User, Calendar, X } from 'lucide-react' // Fixed imports
import { motion, AnimatePresence } from 'framer-motion'
import { TimezoneUtil } from '@/../../backend/src/common/utils/timezone.util' // Assuming shared utils or recreate logic

// Simplify timezone util for frontend
const getMonthString = (date = new Date()) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
}

export default function MobileBilling() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const queryClient = useQueryClient()

    // State
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)

    // Payment State
    const [selectedMonths, setSelectedMonths] = useState<string[]>([])
    const [paymentMethod, setPaymentMethod] = useState('tunai')
    const [successModalOpen, setSuccessModalOpen] = useState(false)

    // Initialize from URL param
    useEffect(() => {
        const customerId = searchParams.get('customerId')
        if (customerId) {
            setSelectedCustomerId(customerId)
        }
    }, [searchParams])

    // Fetch Customer Details if selected
    const { data: customer } = useQuery({
        queryKey: ['customer', selectedCustomerId],
        queryFn: async () => {
            if (!selectedCustomerId) return null
            const { data } = await customersApi.getOne(selectedCustomerId)
            return data
        },
        enabled: !!selectedCustomerId
    })

    // Fetch Partial Payments / Arrears info
    const { data: arrearsInfo } = useQuery({
        queryKey: ['arrears', selectedCustomerId],
        queryFn: async () => {
            if (!selectedCustomerId) return null
            // We can use reportsApi.getArrears or just existing partial payments + logic
            // For simplicity in mobile app, let's use partial payments endpoint
            const { data } = await paymentsApi.getPartialPayments(selectedCustomerId)
            return data
        },
        enabled: !!selectedCustomerId
    })

    // Determine months to show (Current year + previous unpaid)
    const [availableMonths, setAvailableMonths] = useState<string[]>([])

    useEffect(() => {
        // Generate last 12 months + next 3 months
        const months = []
        const today = new Date()
        for (let i = -11; i <= 3; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
            months.push({
                value: getMonthString(d),
                label: d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
                date: d
            })
        }
        // Set simplified string array for now, usually we need checking unpaid status
        // For this prototype, we just allow selecting any month
        // In real app, we should filter out paid months
    }, [])

    // Create Payment Mutation
    const createPaymentMutation = useMutation({
        mutationFn: (data: any) => paymentsApi.create(data),
        onSuccess: () => {
            setSuccessModalOpen(true)
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
            queryClient.invalidateQueries({ queryKey: ['customers'] })
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Gagal memproses pembayaran')
        }
    })

    // Calculate Total
    const pricePerMonth = customer?.tarif?.harga_per_bulan || 0
    const totalAmount = selectedMonths.length * pricePerMonth

    const handlePay = () => {
        if (!selectedCustomerId || selectedMonths.length === 0) return

        createPaymentMutation.mutate({
            customer_id: selectedCustomerId,
            bulan_dibayar: selectedMonths,
            jumlah_bayar: totalAmount,
            metode_bayar: paymentMethod,
            is_partial: false // Simple full payment for mobile v1
        })
    }

    const handleFinish = () => {
        setSuccessModalOpen(false)
        router.push('/m')
    }

    // --- Search Mode Render ---
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
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transaction-all"
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

    // --- Billing Mode Render ---
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <MobileHeader
                title="Tagihan"
                showBack
                onBack={() => setSelectedCustomerId(null)}
            />

            <div className="flex-1 overflow-y-auto pb-32">
                {/* Customer Info Card */}
                <div className="bg-white p-6 border-b border-gray-100 mb-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{customer?.nama}</h2>
                            <p className="text-gray-500 text-sm">{customer?.wilayah}</p>
                        </div>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3 flex justify-between items-center">
                        <span className="text-sm text-indigo-700 font-medium">Tarif Bulanan</span>
                        <span className="text-lg font-bold text-indigo-700">{formatCurrency(pricePerMonth)}</span>
                    </div>
                </div>

                {/* Month Selection */}
                <div className="bg-white p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-gray-500" />
                        Pilih Bulan
                    </h3>

                    <MonthSelector
                        selected={selectedMonths}
                        onChange={setSelectedMonths}
                    />
                </div>

                {/* Payment Method */}
                <div className="p-6">
                    <h3 className="font-bold text-gray-900 mb-3 ml-1">Metode Pembayaran</h3>
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

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-bottom shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-center mb-4 max-w-screen-xl mx-auto">
                    <div>
                        <p className="text-sm text-gray-500">Total Bayar</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">{selectedMonths.length} bulan dipilih</p>
                    </div>
                </div>
                <button
                    onClick={handlePay}
                    disabled={selectedMonths.length === 0 || createPaymentMutation.isPending}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {createPaymentMutation.isPending ? 'Memproses...' : 'Bayar Sekarang'}
                </button>
            </div>

            {/* Success Modal */}
            <AnimatePresence>
                {successModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-3xl p-8 w-full max-w-sm text-center"
                        >
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h2>
                            <p className="text-gray-500 mb-6">
                                Pembayaran sebesar <span className="font-bold text-gray-900">{formatCurrency(totalAmount)}</span> telah diterima.
                            </p>
                            <button
                                onClick={handleFinish}
                                className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl"
                            >
                                Kembali ke Dashboard
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

function CustomerSearchResults({ query, onSelect }: { query: string, onSelect: (id: string) => void }) {
    const { data: results, isLoading } = useQuery({
        queryKey: ['customers-search', query],
        queryFn: async () => {
            if (!query) return []
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

    if (results?.length === 0) {
        return <p className="text-center text-gray-400 mt-10">Tidak ditemukan</p>
    }

    return (
        <div className="space-y-2">
            {results?.map((c: any) => (
                <button
                    key={c.id}
                    onClick={() => onSelect(c.id)}
                    className="w-full text-left p-4 bg-white border border-gray-100 rounded-xl shadow-sm active:bg-gray-50 transition-colors"
                >
                    <p className="font-bold text-gray-900">{c.nama}</p>
                    <p className="text-sm text-gray-500">{c.wilayah}</p>
                </button>
            ))}
        </div>
    )
}

function MonthSelector({ selected, onChange }: { selected: string[], onChange: (m: string[]) => void }) {
    // Generate simple list of months (e.g., current year)
    // Real implementation should fetch unpaid months
    const months = [
        { val: '2025-01', label: 'Jan' }, { val: '2025-02', label: 'Feb' },
        { val: '2025-03', label: 'Mar' }, { val: '2025-04', label: 'Apr' },
        { val: '2025-05', label: 'Mei' }, { val: '2025-06', label: 'Jun' },
        { val: '2025-07', label: 'Jul' }, { val: '2025-08', label: 'Agu' },
        { val: '2025-09', label: 'Sep' }, { val: '2025-10', label: 'Okt' },
        { val: '2025-11', label: 'Nov' }, { val: '2025-12', label: 'Des' },
        { val: '2026-01', label: 'Jan 26' },
    ]

    const toggle = (val: string) => {
        if (selected.includes(val)) onChange(selected.filter(m => m !== val))
        else onChange([...selected, val].sort())
    }

    return (
        <div className="grid grid-cols-4 gap-2">
            {months.map(m => (
                <button
                    key={m.val}
                    onClick={() => toggle(m.val)}
                    className={`py-2 rounded-lg text-sm font-semibold transition-all ${selected.includes(m.val)
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
                        }`}
                >
                    {m.label}
                </button>
            ))}
        </div>
    )
}

'use client'

import AdminLayout from '@/components/AdminLayout'
import { useState, useEffect, Suspense } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi, paymentsApi } from '@/lib/api'
import { formatCurrency, formatMonth } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { Search, DollarSign, CheckCircle, Share2, Printer, Download, User, MapPin, Calendar, CreditCard, ArrowRight, Filter, X } from 'lucide-react'
import { generateBillFilename, generatePDF } from '@/lib/pdf'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ShareButton from '@/components/ui/ShareButton'
import { generatePaymentWhatsAppMessage } from '@/lib/whatsapp'
import PaymentReceipt from '@/components/PaymentReceipt'

function BillingContent() {
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const preSelectedCustomerId = searchParams?.get('customer')

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedWilayah, setSelectedWilayah] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])
  const [metodeBayar, setMetodeBayar] = useState<'tunai' | 'transfer'>('tunai')
  const [catatan, setCatatan] = useState('')
  const [diskonNominal, setDiskonNominal] = useState<number>(0)
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [paymentResult, setPaymentResult] = useState<any>(null)
  const [showFutureMonths, setShowFutureMonths] = useState(false)

  // Fetch wilayah list
  const { data: wilayahData } = useQuery({
    queryKey: ['wilayah-list'],
    queryFn: async () => {
      const { data } = await customersApi.getWilayahList()
      return data
    },
  })

  // Search customers with filters
  const { data: searchResults, isLoading: searchLoading, isFetching: searchFetching } = useQuery({
    queryKey: ['customers-search', searchTerm, selectedWilayah],
    queryFn: async () => {
      const params: any = { limit: 50, status: 'aktif' }
      if (searchTerm && searchTerm.length >= 2) {
        params.search = searchTerm
      }
      if (selectedWilayah) {
        params.wilayah = selectedWilayah
      }
      const { data } = await customersApi.getAll(params)
      return data
    },
    enabled: searchTerm.length >= 2 || selectedWilayah !== '',
  })

  // Get customer detail with arrears
  const { data: customerDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['customer', selectedCustomer?.id],
    queryFn: async () => {
      const { data } = await customersApi.getOne(selectedCustomer.id)
      return data
    },
    enabled: !!selectedCustomer,
  })

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: (data: any) => paymentsApi.create(data),
    onSuccess: (response) => {
      // Ensure customer_nama is present for WhatsApp message
      const result = {
        ...response.data,
        customer_nama: response.data.customer_nama || selectedCustomer?.nama
      }
      setPaymentResult(result)
      setSuccessModalOpen(true)
      setSelectedCustomer(null)
      setSelectedMonths([])
      setCatatan('')
      // Invalidate all related queries to ensure UI updates everywhere
      // Invalidate only essential queries for faster UI response
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['customer'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['customers-summary'] })

      // Invalidate search results only if needed (optional, can be removed for max speed)
      queryClient.invalidateQueries({ queryKey: ['customers-search'] })
    },
  })

  // Load pre-selected customer
  useEffect(() => {
    if (preSelectedCustomerId) {
      customersApi.getOne(preSelectedCustomerId).then(({ data }) => {
        setSelectedCustomer(data)
      })
    }
  }, [preSelectedCustomerId])

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer)
    setSearchTerm('')
    setSelectedWilayah('')
    setSelectedMonths([])
  }

  const toggleMonth = (month: string) => {
    if (selectedMonths.includes(month)) {
      setSelectedMonths(selectedMonths.filter(m => m !== month))
    } else {
      setSelectedMonths([...selectedMonths, month])
    }
  }

  // Helper: Parse month string to Date
  const parseMonthString = (monthStr: string): Date => {
    const [year, month] = monthStr.split('-').map(Number)
    return new Date(year, month - 1, 1)
  }

  // Helper: Format Date to month string
  const formatMonthString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }

  // Generate future months (next 12 months), excluding already paid ones
  const getFutureMonths = (): string[] => {
    const months: string[] = []
    const now = new Date()

    // Get list of all paid months from customer history
    const paidMonths = new Set<string>();
    if (customerDetail?.payments) {
      customerDetail.payments.forEach((p: any) => {
        if (p.bulan_dibayar) {
          try {
            // Handle both string array and JSON string
            const monthList = typeof p.bulan_dibayar === 'string' ? JSON.parse(p.bulan_dibayar) : p.bulan_dibayar;
            if (Array.isArray(monthList)) {
              monthList.forEach((m: string) => paidMonths.add(m));
            }
          } catch (e) {
            // ignore parse error
          }
        }
      });
    }

    for (let i = 1; i <= 12; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const monthStr = formatMonthString(futureDate)

      // Only add if not already paid
      if (!paidMonths.has(monthStr)) {
        months.push(monthStr)
      }
    }
    return months
  }

  // Check if month is in the future
  const isFutureMonth = (month: string): boolean => {
    const monthDate = parseMonthString(month)
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    return monthDate > currentMonth
  }

  // Check if payment includes prepaid months
  const isPrepaidPayment = (): boolean => {
    return selectedMonths.some(month => isFutureMonth(month))
  }

  const calculateTotal = () => {
    if (!customerDetail?.arrears) return 0
    let total = 0

    selectedMonths.forEach(month => {
      // For arrear months, use actual arrear amount
      const arrear = customerDetail.arrears.arrearMonths.find((a: any) => a.month === month)
      if (arrear) {
        total += arrear.amount
      } else if (isFutureMonth(month)) {
        // For future months, use current tariff
        total += customerDetail.tarif?.harga_per_bulan || 0
      }
    })

    return total
  }

  const calculateFinalTotal = () => {
    const subtotal = calculateTotal()
    return Math.max(0, subtotal - diskonNominal)
  }

  const handlePayment = () => {
    if (!selectedCustomer || selectedMonths.length === 0) return

    const paymentData = {
      customer_id: selectedCustomer.id,
      bulan_dibayar: selectedMonths,
      jumlah_bayar: calculateTotal(),
      metode_bayar: metodeBayar,
      catatan: catatan || undefined,
      diskon_nominal: diskonNominal > 0 ? diskonNominal : undefined,
    }

    paymentMutation.mutate(paymentData)
  }

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Billing Individual</h1>
            <p className="text-gray-500 mt-1 text-lg">Proses pembayaran tagihan pelanggan</p>
          </div>
          <Link href="/billing/bulk">
            <Button variant="secondary" className="bg-white hover:bg-gray-50 border border-gray-200 shadow-sm">
              <CreditCard className="w-5 h-5 mr-2 text-gray-500" />
              Mode Billing Kolektif
            </Button>
          </Link>
        </div>

        {/* Split Layout: Left (Customer Search) & Right (Payment Detail) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT SIDE: Customer Search */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-200px)] sticky top-24">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  Pilih Pelanggan
                </h2>
              </div>

              <div className="p-4 space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Cari nama, alamat, atau no. telp..."
                    value={searchTerm}
                    name="search"
                    id="search-customer"
                    autoComplete="off"
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Wilayah Filter */}
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={selectedWilayah}
                    name="wilayah"
                    id="wilayah-filter"
                    onChange={(e) => setSelectedWilayah(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all"
                  >
                    <option value="">Semua Wilayah</option>
                    {wilayahData?.map((wilayah: string) => (
                      <option key={wilayah} value={wilayah}>
                        {wilayah}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <Filter className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Clear Filters Button */}
                {(searchTerm || selectedWilayah) && (
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedWilayah('')
                    }}
                    className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1 mx-auto"
                  >
                    <X className="w-4 h-4" />
                    Hapus Filter
                  </button>
                )}
              </div>

              {/* Results Area */}
              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
                {/* Loading State */}
                {(searchLoading || searchFetching) && (searchTerm.length >= 2 || selectedWilayah) && (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-100 border-t-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500 font-medium">Mencari pelanggan...</p>
                  </div>
                )}

                {/* Search Results */}
                {!searchLoading && !searchFetching && searchResults?.data && searchResults.data.length > 0 && (
                  <>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">
                      Ditemukan {searchResults.data.length} pelanggan
                    </p>
                    {searchResults.data.map((customer: any) => (
                      <button
                        key={customer.id}
                        onClick={() => handleCustomerSelect(customer)}
                        className={`w-full text-left p-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${selectedCustomer?.id === customer.id
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-white border border-gray-100 hover:border-blue-300 hover:shadow-md'
                          }`}
                      >
                        <div className="flex justify-between items-start relative z-10">
                          <div>
                            <p className={`font-bold text-sm ${selectedCustomer?.id === customer.id ? 'text-white' : 'text-gray-900'}`}>
                              {customer.nama}
                            </p>
                            <p className={`text-xs mt-0.5 ${selectedCustomer?.id === customer.id ? 'text-blue-100' : 'text-gray-500'}`}>
                              {customer.alamat}
                            </p>
                            <span className={`inline-block mt-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${selectedCustomer?.id === customer.id
                              ? 'bg-white/20 text-white'
                              : 'bg-gray-100 text-gray-600'
                              }`}>
                              {customer.wilayah}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${selectedCustomer?.id === customer.id ? 'text-white' : 'text-red-600'}`}>
                              {formatCurrency(customer.tunggakan || 0)}
                            </p>
                            <p className={`text-[10px] mt-0.5 ${selectedCustomer?.id === customer.id ? 'text-blue-100' : 'text-gray-400'}`}>
                              {customer.bulan_tunggakan || 0} bulan
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {/* No Results */}
                {(searchTerm.length >= 2 || selectedWilayah) && searchResults?.data?.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-900 font-medium">Tidak ada pelanggan ditemukan</p>
                    <p className="text-sm text-gray-500 mt-1">Coba ubah kata kunci atau filter</p>
                  </div>
                )}

                {/* Initial State */}
                {searchTerm.length < 2 && !selectedWilayah && (
                  <div className="text-center py-12 px-6">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-gray-900 font-bold mb-1">Mulai Pencarian</h3>
                    <p className="text-sm text-gray-500">
                      Ketik nama atau pilih wilayah untuk menemukan pelanggan
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Payment Detail */}
          <div className="lg:col-span-8 space-y-6">
            {!selectedCustomer ? (
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-12 text-center h-[calc(100vh-200px)] flex flex-col items-center justify-center">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <DollarSign className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Pelanggan Dipilih</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Silakan pilih pelanggan dari daftar di sebelah kiri untuk melihat detail tagihan dan melakukan pembayaran.
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-fadeIn">
                {/* Customer Info Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex items-center justify-between bg-gradient-to-r from-white to-blue-50/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
                      {selectedCustomer.nama.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{selectedCustomer.nama}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        <span>{selectedCustomer.alamat}</span>
                        <span className="text-gray-300">|</span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold uppercase">
                          {selectedCustomer.wilayah}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-red-500">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Arrears Selection */}
                  <div className="space-y-6">
                    {loadingDetail ? (
                      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-100 border-t-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-500 font-medium">Memuat data tunggakan...</p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-red-500" />
                              Tagihan Belum Dibayar
                            </h3>
                            <span className="text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                              Total: {formatCurrency(customerDetail?.arrears?.totalArrears || 0)}
                            </span>
                          </div>

                          <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                            {customerDetail?.arrears?.arrearMonths.length > 0 ? (
                              customerDetail.arrears.arrearMonths.map((arrear: any) => {
                                const isSelected = selectedMonths.includes(arrear.month)
                                return (
                                  <div
                                    key={arrear.month}
                                    onClick={() => toggleMonth(arrear.month)}
                                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 group ${isSelected
                                      ? 'border-blue-500 bg-blue-50/50'
                                      : 'border-gray-100 hover:border-blue-300 hover:bg-gray-50'
                                      }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
                                        ? 'border-blue-500 bg-blue-500 text-white'
                                        : 'border-gray-300 group-hover:border-blue-400'
                                        }`}>
                                        {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                          <p className="font-bold text-gray-900 text-sm">{formatMonth(arrear.month)}</p>
                                          <p className="font-bold text-gray-900 text-sm">{formatCurrency(arrear.amount)}</p>
                                        </div>
                                        {arrear.details && (
                                          <p className="text-xs text-gray-500 mt-0.5">{arrear.details}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })
                            ) : (
                              <div className="text-center py-8">
                                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <CheckCircle className="w-6 h-6 text-green-500" />
                                </div>
                                <p className="text-gray-900 font-medium">Lunas!</p>
                                <p className="text-sm text-gray-500">Tidak ada tunggakan pembayaran.</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Future Months */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <div>
                              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-500" />
                                Bayar Dimuka
                              </h3>
                              <p className="text-xs text-gray-500 ml-7 mt-0.5">Opsional untuk 12 bulan ke depan</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowFutureMonths(!showFutureMonths)}
                              className="text-blue-600 hover:bg-blue-50"
                            >
                              {showFutureMonths ? 'Sembunyikan' : 'Tampilkan'}
                            </Button>
                          </div>

                          {showFutureMonths && (
                            <div className="p-4 space-y-2 animate-fadeIn">
                              {getFutureMonths().map((month) => {
                                const isSelected = selectedMonths.includes(month)
                                const tariff = customerDetail?.tarif?.harga_per_bulan || 0
                                return (
                                  <div
                                    key={month}
                                    onClick={() => toggleMonth(month)}
                                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 group ${isSelected
                                      ? 'border-indigo-500 bg-indigo-50/50'
                                      : 'border-gray-100 hover:border-indigo-300 hover:bg-gray-50'
                                      }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
                                        ? 'border-indigo-500 bg-indigo-500 text-white'
                                        : 'border-gray-300 group-hover:border-indigo-400'
                                        }`}>
                                        {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                          <p className="font-bold text-gray-900 text-sm">{formatMonth(month)}</p>
                                          <p className="font-bold text-gray-900 text-sm">{formatCurrency(tariff)}</p>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-0.5">
                                          Tarif: {customerDetail?.tarif?.nama_kategori}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Payment Summary & Form */}
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden sticky top-24">
                      <div className="p-6 bg-gray-900 text-white">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-green-400" />
                          Ringkasan Pembayaran
                        </h3>
                      </div>

                      <div className="p-6 space-y-6">
                        {selectedMonths.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <p>Pilih bulan tagihan untuk melanjutkan pembayaran</p>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Bulan Dipilih</span>
                                <span className="font-bold text-gray-900">{selectedMonths.length} bulan</span>
                              </div>

                              {isPrepaidPayment() && (
                                <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-3">
                                  <div className="mt-0.5">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-blue-900">Termasuk Bayar Dimuka</p>
                                    <p className="text-xs text-blue-700 mt-0.5">
                                      Pembayaran ini mencakup bulan yang belum berjalan.
                                    </p>
                                  </div>
                                </div>
                              )}

                              <div className="pt-4 border-t border-gray-100 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">Subtotal</span>
                                  <span className="font-bold text-gray-900">
                                    {formatCurrency(calculateTotal())}
                                  </span>
                                </div>

                                {/* Discount Input */}
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <label htmlFor="diskon-nominal" className="block text-xs font-medium text-gray-700 mb-2">
                                    Diskon (Opsional)
                                  </label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                                    <input
                                      type="number"
                                      id="diskon-nominal"
                                      name="diskonNominal"
                                      min="0"
                                      max={calculateTotal()}
                                      value={diskonNominal || ''}
                                      onChange={(e) => setDiskonNominal(Number(e.target.value) || 0)}
                                      placeholder="0"
                                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                  </div>
                                  {diskonNominal > calculateTotal() && (
                                    <p className="text-xs text-red-500 mt-1">Diskon tidak boleh melebihi subtotal</p>
                                  )}
                                </div>

                                {diskonNominal > 0 && (
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-red-600">Diskon</span>
                                    <span className="font-bold text-red-600">
                                      - {formatCurrency(diskonNominal)}
                                    </span>
                                  </div>
                                )}

                                <div className="flex justify-between items-end pt-3 border-t border-gray-200">
                                  <span className="text-gray-900 font-bold">Total Bayar</span>
                                  <span className="text-3xl font-extrabold text-blue-600">
                                    {formatCurrency(calculateFinalTotal())}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-100">
                              <Select
                                id="metode-pembayaran"
                                name="metodeBayar"
                                label="Metode Pembayaran"
                                value={metodeBayar}
                                onChange={(e) => setMetodeBayar(e.target.value as 'tunai' | 'transfer')}
                                options={[
                                  { value: 'tunai', label: 'Tunai' },
                                  { value: 'transfer', label: 'Transfer Bank' },
                                ]}
                              />

                              <Input
                                label="Catatan (Opsional)"
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                                placeholder="Tambahkan catatan..."
                                name="catatan"
                                id="catatan-pembayaran"
                              />
                            </div>

                            <Button
                              className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30"
                              onClick={handlePayment}
                              isLoading={paymentMutation.isPending}
                            >
                              Proses Pembayaran
                              <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title="Pembayaran Berhasil"
        size="md"
      >
        <div className="text-center p-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Pembayaran Sukses!
          </h3>
          <p className="text-gray-500 mb-6">
            Transaksi telah berhasil dicatat ke dalam sistem.
          </p>

          {paymentResult && (
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Total Pembayaran</p>
              <p className="text-3xl font-extrabold text-gray-900 mb-4">
                {formatCurrency(paymentResult.jumlah_bayar)}
              </p>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{paymentResult.bulan_dibayar?.length || 0} bulan</span>
                <span>•</span>
                <span className="capitalize">{paymentResult.metode_bayar}</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={async () => {
                  const filename = generateBillFilename(paymentResult?.customer_nama || 'nota');
                  await generatePDF('payment-receipt', filename);
                }}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF (A4)
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  const receipt = document.getElementById('payment-receipt');
                  if (receipt) {
                    receipt.style.display = 'block';
                    setTimeout(() => {
                      window.print();
                      receipt.style.display = 'none';
                    }, 100);
                  }
                }}
                className="w-full"
              >
                <Printer className="w-4 h-4 mr-2" />
                Cetak (A4)
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  const receipt = document.getElementById('payment-receipt-thermal');
                  if (receipt) {
                    receipt.style.display = 'block';
                    setTimeout(() => {
                      window.print();
                      receipt.style.display = 'none';
                    }, 100);
                  }
                }}
                className="w-full"
              >
                <Printer className="w-4 h-4 mr-2" />
                Thermal (58mm)
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  const receipt = document.getElementById('payment-receipt-compact');
                  if (receipt) {
                    receipt.style.display = 'block';
                    setTimeout(() => {
                      window.print();
                      receipt.style.display = 'none';
                    }, 100);
                  }
                }}
                className="w-full"
              >
                <Printer className="w-4 h-4 mr-2" />
                Hemat (1/3 F4)
              </Button>
            </div>

            <div className="flex justify-center pt-2">
              <ShareButton
                message={generatePaymentWhatsAppMessage(paymentResult)}
                title="Kirim Bukti via WhatsApp"
                defaultPhone={selectedCustomer?.nomor_telepon}
              />
            </div>

            <Button
              className="w-full mt-4 bg-gray-900 hover:bg-gray-800 text-white"
              onClick={() => setSuccessModalOpen(false)}
            >
              Selesai & Tutup
            </Button>
          </div>
        </div>
      </Modal>

      {/* Hidden Payment Receipts for Printing */}
      {paymentResult && (
        <>
          <PaymentReceipt
            payment={paymentResult}
            customer={customerDetail}
            isThermal={false}
          />
          <PaymentReceipt
            payment={paymentResult}
            customer={customerDetail}
            isThermal={true}
          />
          <PaymentReceipt
            payment={paymentResult}
            customer={customerDetail}
            isCompact={true}
          />
        </>
      )}
    </AdminLayout>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600 mx-auto"></div>
            <p className="mt-6 text-gray-500 font-medium">Memuat sistem billing...</p>
          </div>
        </div>
      </AdminLayout>
    }>
      <BillingContent />
    </Suspense>
  )
}

'use client'

import AdminLayout from '@/components/AdminLayout'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi, paymentsApi } from '@/lib/api'
import { formatCurrency, formatMonth } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { Search, CheckCircle, Users, DollarSign, Printer, Download, ArrowLeft, Filter, ChevronDown, ChevronUp, X, AlertCircle } from 'lucide-react'
import { generateBillFilename, generatePDF } from '@/lib/pdf'
import PaymentReceipt from '@/components/PaymentReceipt'
import BulkPaymentReceipt from '@/components/BulkPaymentReceipt'
import Link from 'next/link'

interface SelectedCustomerPayment {
  customer: any
  selectedMonths: string[]
  totalAmount: number
}

export default function BulkBillingPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [wilayah, setWilayah] = useState('')
  const [selectedCustomers, setSelectedCustomers] = useState<Map<string, SelectedCustomerPayment>>(new Map())
  const [metodeBayar, setMetodeBayar] = useState<'tunai' | 'transfer'>('tunai')
  const [namaPembayar, setNamaPembayar] = useState('')
  const [catatan, setCatatan] = useState('')
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [processingResults, setProcessingResults] = useState<any[]>([])
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null)
  const [customerArrears, setCustomerArrears] = useState<Map<string, any>>(new Map())
  const [selectedPaymentForPrint, setSelectedPaymentForPrint] = useState<any>(null)

  const { data: customers, isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers-bulk', { searchTerm, wilayah }],
    queryFn: async () => {
      const params: any = { limit: 50, status: 'aktif' }
      if (searchTerm) params.search = searchTerm
      if (wilayah) params.wilayah = wilayah
      const { data } = await customersApi.getAll(params)
      return data
    },
  })

  const { data: wilayahList } = useQuery({
    queryKey: ['wilayah-list'],
    queryFn: async () => {
      const { data } = await customersApi.getWilayahList()
      return data
    },
  })

  const processPaymentsMutation = useMutation({
    mutationFn: async (payments: any[]) => {
      const results = []
      for (const payment of payments) {
        try {
          const { data } = await paymentsApi.create(payment)
          // Inject customer_nama into data for receipt printing
          const paymentData = { ...data, customer_nama: payment.customer_nama }
          results.push({ success: true, customer: payment.customer_nama, data: paymentData })
        } catch (error: any) {
          results.push({ success: false, customer: payment.customer_nama, error: error.message })
        }
      }
      return results
    },
    onSuccess: (results) => {
      setProcessingResults(results)
      setSuccessModalOpen(true)
      setSelectedCustomers(new Map())
      // Invalidate all related queries to ensure UI updates everywhere
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customers-bulk'] })
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['customer'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const loadCustomerArrears = async (customerId: string) => {
    if (customerArrears.has(customerId)) {
      setExpandedCustomer(expandedCustomer === customerId ? null : customerId)
      return
    }

    try {
      const { data } = await customersApi.getOne(customerId)
      const newArrearsMap = new Map(customerArrears)
      newArrearsMap.set(customerId, data.arrears)
      setCustomerArrears(newArrearsMap)
      setExpandedCustomer(customerId)
    } catch (error) {
      console.error('Error loading customer arrears:', error)
    }
  }

  const toggleMonthForCustomer = (customerId: string, month: string, customer: any, arrearAmount: number) => {
    const newMap = new Map(selectedCustomers)
    const existing = newMap.get(customerId)

    if (existing) {
      const monthIndex = existing.selectedMonths.indexOf(month)
      if (monthIndex > -1) {
        const newMonths = existing.selectedMonths.filter(m => m !== month)
        if (newMonths.length === 0) {
          newMap.delete(customerId)
        } else {
          newMap.set(customerId, {
            ...existing,
            selectedMonths: newMonths,
            totalAmount: existing.totalAmount - arrearAmount,
          })
        }
      } else {
        newMap.set(customerId, {
          ...existing,
          selectedMonths: [...existing.selectedMonths, month],
          totalAmount: existing.totalAmount + arrearAmount,
        })
      }
    } else {
      newMap.set(customerId, {
        customer,
        selectedMonths: [month],
        totalAmount: arrearAmount,
      })
    }

    setSelectedCustomers(newMap)
  }

  const handleProcessPayments = () => {
    if (selectedCustomers.size === 0 || !namaPembayar) return

    const payments = Array.from(selectedCustomers.values()).map(item => ({
      customer_id: item.customer.id,
      customer_nama: item.customer.nama,
      bulan_dibayar: item.selectedMonths,
      jumlah_bayar: item.totalAmount,
      metode_bayar: metodeBayar,
      catatan: `Pembayaran kolektif oleh: ${namaPembayar}${catatan ? ` - ${catatan}` : ''}`,
    }))

    processPaymentsMutation.mutate(payments)
  }

  const totalSelectedCustomers = selectedCustomers.size
  const totalAmount = Array.from(selectedCustomers.values()).reduce((sum, item) => sum + item.totalAmount, 0)
  const totalMonths = Array.from(selectedCustomers.values()).reduce((sum, item) => sum + item.selectedMonths.length, 0)

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Billing Kolektif</h1>
            <p className="text-gray-500 mt-1 text-lg">Proses pembayaran untuk banyak pelanggan sekaligus</p>
          </div>
          <Link href="/billing">
            <Button variant="secondary" className="bg-white hover:bg-gray-50 border border-gray-200 shadow-sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Individual
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Customer Selection */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-200px)] sticky top-24">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Pilih Pelanggan
                </h2>
              </div>

              <div className="p-4 space-y-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="customer-search"
                    name="search"
                    type="text"
                    placeholder="Cari nama atau alamat..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    id="wilayah-filter"
                    name="wilayah"
                    value={wilayah}
                    onChange={(e) => setWilayah(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all"
                  >
                    <option value="">Semua Wilayah</option>
                    {wilayahList?.map((w: string) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-200">
                {loadingCustomers ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-100 border-t-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500 font-medium">Memuat pelanggan...</p>
                  </div>
                ) : customers?.data && customers.data.length > 0 ? (
                  <>
                    {customers.data.map((customer: any) => {
                      const isSelected = selectedCustomers.has(customer.id)
                      const selectedData = selectedCustomers.get(customer.id)
                      const isExpanded = expandedCustomer === customer.id
                      const arrears = customerArrears.get(customer.id)

                      return (
                        <div
                          key={customer.id}
                          className={`border rounded-xl overflow-hidden transition-all duration-200 ${isSelected ? 'border-blue-500 shadow-md bg-blue-50/10' : 'border-gray-200 hover:border-blue-300'
                            }`}
                        >
                          <div
                            onClick={() => loadCustomerArrears(customer.id)}
                            className="w-full text-left p-4 cursor-pointer"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-gray-900">{customer.nama}</p>
                                  {isSelected && <CheckCircle className="w-4 h-4 text-blue-500" />}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">{customer.alamat}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold uppercase">
                                    {customer.wilayah}
                                  </span>
                                  {isSelected && selectedData && (
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">
                                      {selectedData.selectedMonths.length} bulan dipilih
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-sm font-bold text-red-600">
                                  {formatCurrency(customer.tunggakan || 0)}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">{customer.bulan_tunggakan || 0} bulan</p>
                                {isSelected && selectedData && (
                                  <p className="text-sm font-bold text-blue-600 mt-2 bg-blue-50 px-2 py-0.5 rounded">
                                    + {formatCurrency(selectedData.totalAmount)}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex justify-center mt-2">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-gray-100 bg-gray-50/50 p-4 animate-fadeIn">
                              {arrears ? (
                                <>
                                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Pilih Bulan Tagihan:</p>
                                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                    {arrears.arrearMonths?.length > 0 ? (
                                      arrears.arrearMonths.map((arrear: any) => {
                                        const selectedData = selectedCustomers.get(customer.id)
                                        const isMonthSelected = selectedData?.selectedMonths.includes(arrear.month)

                                        return (
                                          <div
                                            key={arrear.month}
                                            onClick={() => toggleMonthForCustomer(customer.id, arrear.month, customer, arrear.amount)}
                                            className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-3 ${isMonthSelected
                                              ? 'border-blue-500 bg-blue-50'
                                              : 'border-gray-200 bg-white hover:border-blue-300'
                                              }`}
                                          >
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isMonthSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'
                                              }`}>
                                              {isMonthSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <div className="flex-1">
                                              <p className="font-bold text-gray-900 text-sm">{formatMonth(arrear.month)}</p>
                                              {arrear.details && (
                                                <p className="text-xs text-gray-500 mt-0.5">{arrear.details}</p>
                                              )}
                                            </div>
                                            <p className="font-bold text-gray-900 text-sm">{formatCurrency(arrear.amount)}</p>
                                          </div>
                                        )
                                      })
                                    ) : (
                                      <div className="text-center py-4 bg-white rounded-lg border border-dashed border-gray-200">
                                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                        <p className="text-sm text-gray-900 font-medium">Lunas!</p>
                                        <p className="text-xs text-gray-500">Tidak ada tunggakan.</p>
                                      </div>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div className="text-center py-4">
                                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-100 border-t-blue-600 mx-auto"></div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-900 font-medium">Tidak ada pelanggan ditemukan</p>
                    <p className="text-sm text-gray-500 mt-1">Coba ubah kata kunci pencarian</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Summary & Payment Form */}
          <div className="lg:col-span-5 space-y-6">
            {totalSelectedCustomers === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-12 text-center h-[calc(100vh-200px)] flex flex-col items-center justify-center sticky top-24">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <Users className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Pelanggan Dipilih</h3>
                <p className="text-gray-500 max-w-xs mx-auto">
                  Pilih pelanggan dari daftar di sebelah kiri dan tandai bulan tagihan yang akan dibayar.
                </p>
              </div>
            ) : (
              <div className="space-y-6 sticky top-24 animate-fadeIn">
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                  <div className="p-6 bg-gray-900 text-white">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      Ringkasan Pembayaran
                    </h3>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Pelanggan</p>
                        <p className="text-2xl font-extrabold text-gray-900">{totalSelectedCustomers}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Total Bulan</p>
                        <p className="text-2xl font-extrabold text-gray-900">{totalMonths}</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 col-span-3 mt-2">
                        <p className="text-xs text-blue-600 uppercase tracking-wider font-bold mb-1">Total Bayar</p>
                        <p className="text-3xl font-extrabold text-blue-700">{formatCurrency(totalAmount)}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-sm font-bold text-gray-900 mb-3">Detail Pelanggan:</p>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                        {Array.from(selectedCustomers.values()).map((item) => (
                          <div key={item.customer.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{item.customer.nama}</p>
                              <p className="text-xs text-gray-500">{item.selectedMonths.length} bulan</p>
                            </div>
                            <p className="font-bold text-gray-900 text-sm">{formatCurrency(item.totalAmount)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Informasi Pembayaran</h3>
                  <div className="space-y-4">
                    <Input
                      id="nama-pembayar"
                      name="namaPembayar"
                      label="Nama Pembayar / Kolektor *"
                      placeholder="Nama orang yang menyerahkan pembayaran"
                      value={namaPembayar}
                      onChange={(e) => setNamaPembayar(e.target.value)}
                      required
                    />

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
                      id="catatan-pembayaran"
                      name="catatan"
                      label="Catatan Tambahan (Opsional)"
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder="Catatan untuk pembayaran ini"
                    />

                    <Button
                      className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30"
                      onClick={handleProcessPayments}
                      isLoading={processPaymentsMutation.isPending}
                      disabled={!namaPembayar || totalSelectedCustomers === 0}
                    >
                      <Users className="w-5 h-5 mr-2" />
                      Proses {totalSelectedCustomers} Pembayaran
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title="Hasil Pembayaran Kolektif"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center py-6 bg-green-50 rounded-xl border border-green-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-green-900">Pembayaran Berhasil Diproses!</h3>
            <p className="text-green-700">Semua transaksi telah dicatat ke dalam sistem.</p>
          </div>

          {processingResults.length > 0 && (
            <div className="space-y-3">
              <p className="font-bold text-gray-900">Detail Hasil:</p>
              <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                {processingResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg flex items-center justify-between border ${result.success ? 'bg-white border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className={`font-medium ${result.success ? 'text-gray-900' : 'text-red-900'}`}>
                        {result.customer}
                      </span>
                    </div>
                    {result.success ? (
                      <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">BERHASIL</span>
                    ) : (
                      <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded">GAGAL</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Collective Print Options */}
          {processingResults.some(r => r.success) && (
            <div className="border-t border-gray-100 pt-6">
              <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-600" />
                Cetak Kolektif (Semua dalam 1 Nota)
              </p>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    const receipt = document.getElementById('bulk-receipt');
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
                  Cetak A4
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const receipt = document.getElementById('bulk-receipt-thermal');
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
                  Thermal
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    const filename = generateBillFilename('kolektif');
                    await generatePDF('bulk-receipt', filename);
                  }}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          )}

          {/* Print and Download Nota Buttons - Individual */}
          {processingResults.some(r => r.success) && (
            <div className="border-t border-gray-100 pt-6">
              <p className="text-sm font-bold text-gray-900 mb-3">Cetak/Unduh Nota Individual</p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                {processingResults.filter(r => r.success).map((result, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <span className="text-sm font-bold text-gray-700">{result.customer}</span>
                    <div className="flex space-x-2">
                      <button
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Cetak Thermal 58mm"
                        onClick={() => {
                          setSelectedPaymentForPrint(result.data);
                          setTimeout(() => {
                            const receipt = document.getElementById('payment-receipt-thermal');
                            if (receipt) {
                              receipt.style.display = 'block';
                              setTimeout(() => {
                                window.print();
                                receipt.style.display = 'none';
                              }, 100);
                            }
                          }, 100);
                        }}
                      >
                        <Printer className="w-4 h-4" />
                        <span className="sr-only">Thermal</span>
                      </button>
                      <button
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Cetak Hemat (1/3 F4)"
                        onClick={() => {
                          setSelectedPaymentForPrint(result.data);
                          setTimeout(() => {
                            const receipt = document.getElementById('payment-receipt-compact');
                            if (receipt) {
                              receipt.style.display = 'block';
                              setTimeout(() => {
                                window.print();
                                receipt.style.display = 'none';
                              }, 100);
                            }
                          }, 100);
                        }}
                      >
                        <Printer className="w-4 h-4" />
                        <span className="sr-only">Hemat</span>
                      </button>
                      <button
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Cetak A4"
                        onClick={() => {
                          setSelectedPaymentForPrint(result.data);
                          setTimeout(() => {
                            const receipt = document.getElementById('payment-receipt');
                            if (receipt) {
                              receipt.style.display = 'block';
                              setTimeout(() => {
                                window.print();
                                receipt.style.display = 'none';
                              }, 100);
                            }
                          }, 100);
                        }}
                      >
                        <Printer className="w-4 h-4" />
                        <span className="sr-only">A4</span>
                      </button>
                      <button
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Download PDF"
                        onClick={async () => {
                          setSelectedPaymentForPrint(result.data);
                          await new Promise(r => setTimeout(r, 100));
                          const filename = generateBillFilename(result.customer);
                          await generatePDF('payment-receipt', filename);
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            className="w-full mt-4 bg-gray-900 hover:bg-gray-800 text-white"
            onClick={() => setSuccessModalOpen(false)}
          >
            Selesai & Tutup
          </Button>
        </div>
      </Modal>

      {/* Hidden Payment Receipts for Printing */}
      {selectedPaymentForPrint && (
        <>
          <PaymentReceipt
            payment={selectedPaymentForPrint}
            isThermal={false}
          />
          <PaymentReceipt
            payment={selectedPaymentForPrint}
            isThermal={true}
          />
          <PaymentReceipt
            payment={selectedPaymentForPrint}
            isCompact={true}
          />
        </>
      )}

      {/* Hidden Bulk Payment Receipts for Collective Printing */}
      {processingResults.length > 0 && processingResults.some(r => r.success) && (
        <>
          <BulkPaymentReceipt
            payments={processingResults.filter(r => r.success).map(r => r.data)}
            isThermal={false}
          />
          <BulkPaymentReceipt
            payments={processingResults.filter(r => r.success).map(r => r.data)}
            isThermal={true}
          />
        </>
      )}
    </AdminLayout>
  )
}

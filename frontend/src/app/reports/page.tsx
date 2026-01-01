'use client'

import AdminLayout from '@/components/AdminLayout'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/lib/api'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { FileText, Download, TrendingUp, Printer, CheckSquare, Calendar, Filter, ArrowRight, User, MapPin, AlertCircle, CheckCircle, X } from 'lucide-react'
import { BulkBillPrintTemplate } from '@/components/BulkBillPrintTemplate'
import { generatePDF, generateBillFilename } from '@/lib/pdf'
// import TransactionReport from '@/components/transactions/TransactionReport' // Deprecated
import PaymentReportPrint from '@/components/reports/PaymentReportPrint'
import ArrearsReportPrint from '@/components/reports/ArrearsReportPrint'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'payments' | 'arrears'>('payments')

  // Payment Report Filters
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [metodeBayar, setMetodeBayar] = useState('')

  // Arrears Report Filters
  const [wilayah, setWilayah] = useState('')
  const [sortBy, setSortBy] = useState('amount_desc')

  // Selection state for bulk printing
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false)

  const [page, setPage] = useState(1)
  const limit = 30

  // Payment Report Query
  const { data: paymentReport, isLoading: loadingPayments } = useQuery({
    queryKey: ['payment-report', { dateFrom, dateTo, metodeBayar, page }],
    queryFn: async () => {
      const params: any = { page, limit } // Add pagination params
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo) params.dateTo = dateTo
      if (metodeBayar) params.metode_bayar = metodeBayar

      const { data } = await reportsApi.getPayments(params)
      return data
    },
    enabled: activeTab === 'payments',
  })

  // Reset page when filters change
  const handleFilterChange = (setter: (val: any) => void, val: any) => {
    setter(val)
    setPage(1)
  }

  // Arrears Report Query
  const { data: arrearsReport, isLoading: loadingArrears } = useQuery({
    queryKey: ['arrears-report', { wilayah, sortBy }],
    queryFn: async () => {
      const params: any = {}
      if (wilayah) params.wilayah = wilayah
      if (sortBy) params.sortBy = sortBy

      const { data } = await reportsApi.getArrears(params)
      return data
    },
    enabled: activeTab === 'arrears',
  })

  // Selection handlers
  const handleSelectAll = () => {
    if (!arrearsReport?.customers) return
    if (selectedCustomers.length === arrearsReport.customers.length) {
      setSelectedCustomers([])
    } else {
      setSelectedCustomers(arrearsReport.customers.map((item: any) => item.customer.id))
    }
  }

  const handleToggleCustomer = (customerId: string) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    )
  }

  const [printTarget, setPrintTarget] = useState<'bulk-bills' | 'payment-report' | 'arrears-report' | null>(null)

  const handlePrintPaymentReport = () => {
    setPrintTarget('payment-report')
    // Printing is now handled via the overlay button
  }

  const handlePrintArrearsReport = () => {
    setPrintTarget('arrears-report')
    setTimeout(() => {
      window.print()
      setPrintTarget(null)
    }, 100)
  }

  const handlePrintBulkBills = () => {
    setPrintTarget('bulk-bills')
    setTimeout(() => {
      window.print()
      setPrintTarget(null)
    }, 100)
  }

  const handleBulkPrint = () => {
    // Legacy mapping if needed, or redirect to handlePrintBulkBills
    handlePrintBulkBills()
  }

  const handleBulkDownloadPDF = async () => {
    if (selectedCustomers.length === 0) {
      alert('Pilih pelanggan terlebih dahulu')
      return
    }

    setIsDownloadingPDF(true)
    try {
      const filename = `Tagihan_Massal_${new Date().toLocaleDateString('id-ID').replace(/\//g, '_')}.pdf`
      await generatePDF('bulk-bill-template', filename)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Gagal mengunduh PDF. Silakan coba lagi.')
    } finally {
      setIsDownloadingPDF(false)
    }
  }

  // Get selected customer data
  const selectedCustomerData = arrearsReport?.customers?.filter((item: any) =>
    selectedCustomers.includes(item.customer.id)
  ) || []

  // Get unique wilayah options from arrears report
  const wilayahOptions = [
    { value: '', label: 'Semua Wilayah' },
    ...Array.from(new Set(arrearsReport?.customers?.map((item: any) => item.customer.wilayah) || []))
      .filter(Boolean)
      .sort()
      .map((w: any) => ({ value: w, label: w }))
  ]

  return (
    <AdminLayout>
      {/* Print Templates */}
      {printTarget === 'bulk-bills' && (
        <BulkBillPrintTemplate customers={selectedCustomerData} />
      )}

      {/* Payment Print Preview Overlay */}
      {printTarget === 'payment-report' && paymentReport && (
        <div className="fixed inset-0 z-[50] bg-white flex flex-col items-center overflow-auto p-4 sm:p-8">
          <div className="w-full max-w-5xl flex justify-between items-center mb-6 print:hidden">
            <h2 className="text-xl font-bold text-gray-800">Pratinjau Cetak</h2>
            <div className="flex gap-3">
              <Button onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" />
                Cetak
              </Button>
              <Button variant="outline" onClick={() => setPrintTarget(null)}>
                <X className="w-4 h-4 mr-2" />
                Tutup
              </Button>
            </div>
          </div>

          <div className="bg-gray-100 p-8 rounded-xl print:p-0 print:bg-white w-full flex justify-center min-h-[500px]">
            <PaymentReportPrint
              payments={paymentReport.payments}
              period={
                dateFrom && dateTo
                  ? `${format(new Date(dateFrom), 'dd MMMM yyyy', { locale: id })} - ${format(new Date(dateTo), 'dd MMMM yyyy', { locale: id })}`
                  : 'Semua Periode'
              }
            />
          </div>
        </div>
      )}

      {printTarget === 'arrears-report' && arrearsReport && (
        <ArrearsReportPrint
          data={arrearsReport.customers}
          wilayah={wilayah}
          totalCustomers={arrearsReport.summary.totalCustomers}
          totalArrears={arrearsReport.summary.totalArrears}
        />
      )}

      <div className="space-y-8 print:hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Laporan</h1>
            <p className="text-gray-500 mt-1 text-lg">Analisis keuangan dan status pembayaran</p>
          </div>

        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 inline-flex">
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-2.5 px-6 rounded-lg font-bold text-sm transition-all duration-200 ${activeTab === 'payments'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            Laporan Pembayaran
          </button>
          <button
            onClick={() => setActiveTab('arrears')}
            className={`py-2.5 px-6 rounded-lg font-bold text-sm transition-all duration-200 ${activeTab === 'arrears'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            Laporan Tunggakan
          </button>
        </div>

        {/* Payment Report */}
        {activeTab === 'payments' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 border border-gray-100">
              <div className="flex flex-col md:flex-row gap-6 items-end">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                  <div>
                    <Input
                      id="payment-date-from"
                      name="dateFrom"
                      type="date"
                      label="Dari Tanggal"
                      value={dateFrom}
                      onChange={(e) => handleFilterChange(setDateFrom, e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      id="payment-date-to"
                      name="dateTo"
                      type="date"
                      label="Sampai Tanggal"
                      value={dateTo}
                      onChange={(e) => handleFilterChange(setDateTo, e.target.value)}
                    />
                  </div>
                  <div>
                    <Select
                      id="payment-method"
                      name="metodeBayar"
                      label="Metode Pembayaran"
                      value={metodeBayar}
                      onChange={(e) => handleFilterChange(setMetodeBayar, e.target.value)}
                      options={[
                        { value: '', label: 'Semua Metode' },
                        { value: 'tunai', label: 'Tunai' },
                        { value: 'transfer', label: 'Transfer Bank' },
                      ]}
                    />
                  </div>
                </div>
                <div>
                  <Button
                    onClick={handlePrintPaymentReport}
                    disabled={!paymentReport?.payments?.length}
                    className="mb-[2px]"
                  >
                    <Printer className="w-5 h-5 mr-2" />
                    Cetak Laporan
                  </Button>
                </div>
              </div>
            </div>

            {/* Summary */}
            {paymentReport?.summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <FileText className="w-24 h-24 text-blue-600" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Transaksi</p>
                    <p className="text-4xl font-extrabold text-gray-900 tracking-tight">
                      {paymentReport.summary.totalTransactions}
                    </p>
                    <div className="mt-2 text-sm text-gray-500">
                      transaksi ditemukan
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <CheckCircle className="w-24 h-24 text-green-600" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Pemasukan</p>
                    <p className="text-4xl font-extrabold text-green-600 tracking-tight">
                      {formatCurrency(paymentReport.summary.totalAmount)}
                    </p>
                    <div className="mt-2 text-sm text-gray-500">
                      dari hasil filter saat ini
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment List */}
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Rincian Pembayaran
                </h3>
              </div>

              {loadingPayments ? (
                <div className="text-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500 font-medium">Memuat data pembayaran...</p>
                </div>
              ) : paymentReport?.payments && paymentReport.payments.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Waktu
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Pelanggan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Jumlah
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Metode
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paymentReport.payments.map((payment: any) => (
                          <tr key={payment.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-6 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900">
                                  {formatDateTime(payment.tanggal_bayar)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <div className="text-sm font-bold text-gray-900">{payment.customer_nama}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{payment.customer?.wilayah}</div>
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap">
                              <div className="text-sm font-bold text-gray-900">
                                {formatCurrency(payment.jumlah_bayar)}
                              </div>
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${payment.metode_bayar === 'tunai'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                                }`}>
                                {payment.metode_bayar}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination UI */}
                  {paymentReport?.meta && paymentReport.meta.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                      <div className="text-sm text-gray-500">
                        Halaman <span className="font-bold text-gray-900">{page}</span> dari <span className="font-bold text-gray-900">{paymentReport.meta.totalPages}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Sebelumnya
                        </button>
                        <button
                          onClick={() => setPage(p => Math.min(paymentReport.meta.totalPages, p + 1))}
                          disabled={page >= paymentReport.meta.totalPages}
                          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Selanjutnya
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Tidak ada data pembayaran</h3>
                  <p className="text-gray-500 mt-2">Coba ubah filter pencarian Anda</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Arrears Report */}
        {
          activeTab === 'arrears' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Filters */}
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 border border-gray-100">
                <div className="flex flex-col md:flex-row gap-6 items-end">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                    <Select
                      id="arrears-wilayah"
                      name="wilayah"
                      label="Filter Wilayah"
                      value={wilayah}
                      onChange={(e) => setWilayah(e.target.value)}
                      options={wilayahOptions}
                    />
                    <Select
                      id="arrears-sort"
                      name="sortBy"
                      label="Urutkan Berdasarkan"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      options={[
                        { value: 'amount_desc', label: 'Tunggakan Terbesar' },
                        { value: 'amount_asc', label: 'Tunggakan Terkecil' },
                      ]}
                    />
                  </div>
                  <div>
                    <Button
                      onClick={handlePrintArrearsReport}
                      disabled={!arrearsReport?.customers?.length}
                      className="mb-[2px]"
                    >
                      <Printer className="w-5 h-5 mr-2" />
                      Cetak Laporan
                    </Button>
                  </div>
                </div>
              </div>

              {/* Summary */}
              {arrearsReport?.summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <User className="w-24 h-24 text-orange-600" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-sm font-medium text-gray-500 mb-1">Pelanggan Menunggak</p>
                      <p className="text-4xl font-extrabold text-orange-600 tracking-tight">
                        {arrearsReport.summary.totalCustomers}
                      </p>
                      <div className="mt-2 text-sm text-gray-500">
                        pelanggan perlu ditindaklanjuti
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <AlertCircle className="w-24 h-24 text-red-600" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-sm font-medium text-gray-500 mb-1">Total Tunggakan</p>
                      <p className="text-4xl font-extrabold text-red-600 tracking-tight">
                        {formatCurrency(arrearsReport.summary.totalArrears)}
                      </p>
                      <div className="mt-2 text-sm text-gray-500">
                        potensi pendapatan tertunda
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Arrears List */}
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-red-500" />
                    Rincian Tunggakan
                  </h3>
                </div>

                <div className="p-6">
                  {loadingArrears ? (
                    <div className="text-center py-20">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600 mx-auto"></div>
                      <p className="mt-4 text-gray-500 font-medium">Memuat data tunggakan...</p>
                    </div>
                  ) : arrearsReport?.customers && arrearsReport.customers.length > 0 ? (
                    <>
                      {/* Bulk Actions */}
                      <div className="bg-gray-50 rounded-xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-gray-200">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                          <Button
                            variant="outline"
                            onClick={handleSelectAll}
                            size="sm"
                            className="bg-white"
                          >
                            <CheckSquare className="w-4 h-4 mr-2" />
                            {selectedCustomers.length === arrearsReport.customers.length
                              ? 'Batalkan Semua'
                              : 'Pilih Semua'}
                          </Button>

                          {selectedCustomers.length > 0 && (
                            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                              {selectedCustomers.length} dipilih
                            </span>
                          )}
                        </div>

                        {selectedCustomers.length > 0 && (
                          <div className="flex gap-2 w-full md:w-auto">
                            <Button
                              variant="secondary"
                              onClick={handleBulkPrint}
                              size="sm"
                              className="flex-1 md:flex-none bg-white shadow-sm"
                            >
                              <Printer className="w-4 h-4 mr-2" />
                              Cetak Tagihan
                            </Button>


                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        {arrearsReport.customers.map((item: any) => (
                          <div
                            key={item.customer.id}
                            className={`group border rounded-xl p-4 transition-all duration-200 ${selectedCustomers.includes(item.customer.id)
                              ? 'border-blue-500 bg-blue-50/30 shadow-md'
                              : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                              }`}
                          >
                            <div className="flex items-start gap-4">
                              {/* Checkbox */}
                              <div className="pt-1">
                                <input
                                  id={`customer-check-${item.customer.id}`}
                                  name={`customer_select_${item.customer.id}`}
                                  type="checkbox"
                                  checked={selectedCustomers.includes(item.customer.id)}
                                  onChange={() => handleToggleCustomer(item.customer.id)}
                                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                              </div>

                              {/* Customer Info */}
                              <div className="flex-1">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 mb-2">
                                  <div>
                                    <p className="font-bold text-lg text-gray-900">{item.customer.nama}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                      <MapPin className="w-3.5 h-3.5" />
                                      <span>{item.customer.alamat}</span>
                                      <span className="text-gray-300">|</span>
                                      <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">
                                        {item.customer.wilayah}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-left md:text-right bg-red-50 p-2 rounded-lg border border-red-100">
                                    <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider mb-0.5">Total Tunggakan</p>
                                    <p className="text-xl font-extrabold text-red-600">
                                      {formatCurrency(item.arrears.totalArrears)}
                                    </p>
                                    <p className="text-xs font-medium text-red-500 mt-0.5">{item.arrears.totalMonths} bulan menunggak</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-2 py-1.5 rounded-lg w-fit">
                                  <span className="font-medium">Tarif Aktif:</span>
                                  <span>{item.customer.tarif?.nama_kategori}</span>
                                  <span className="text-gray-400">•</span>
                                  <span className="font-bold">{formatCurrency(item.customer.tarif?.harga_per_bulan || 0)}/bulan</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-20">
                      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Tidak ada tunggakan</h3>
                      <p className="text-gray-500 mt-2">Semua pelanggan telah melunasi tagihan mereka</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        }
      </div >
    </AdminLayout >
  )
}

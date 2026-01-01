'use client'

import AdminLayout from '@/components/AdminLayout'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentsApi, depositsApi } from '@/lib/api'
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import { Wallet, Plus, Trash2, CheckCircle, Printer, Download, ArrowRight, Calendar, FileText, AlertCircle } from 'lucide-react'
import { generateBillFilename, generatePDF } from '@/lib/pdf'
import DepositReceipt from '@/components/DepositReceipt'
import DepositReportPrint from '@/components/deposits/DepositReportPrint'

export default function DepositsPage() {
  const queryClient = useQueryClient()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedPayments, setSelectedPayments] = useState<string[]>([])
  const [tanggalSetor, setTanggalSetor] = useState(new Date().toISOString().split('T')[0])
  const [catatan, setCatatan] = useState('')
  const [selectedDepositForPrint, setSelectedDepositForPrint] = useState<any>(null)
  const [printMode, setPrintMode] = useState<'receipt' | 'report' | null>(null)

  // Get undeposited funds
  const { data: undepositedFunds, isLoading: loadingUndeposited } = useQuery({
    queryKey: ['undeposited-funds'],
    queryFn: async () => {
      const { data } = await paymentsApi.getUndeposited()
      return data
    },
  })

  // Get deposits history
  const { data: deposits, isLoading: loadingDeposits } = useQuery({
    queryKey: ['deposits'],
    queryFn: async () => {
      const { data } = await depositsApi.getAll()
      return data
    },
  })

  const createDepositMutation = useMutation({
    mutationFn: (data: any) => depositsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['undeposited-funds'] })
      queryClient.invalidateQueries({ queryKey: ['deposits'] })
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      setCreateModalOpen(false)
      setSelectedPayments([])
      setCatatan('')
    },
  })

  const cancelDepositMutation = useMutation({
    mutationFn: (id: string) => depositsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['undeposited-funds'] })
      queryClient.invalidateQueries({ queryKey: ['deposits'] })
      queryClient.invalidateQueries({ queryKey: ['payments'] })
    },
  })

  const togglePayment = (paymentId: string) => {
    if (selectedPayments.includes(paymentId)) {
      setSelectedPayments(selectedPayments.filter(id => id !== paymentId))
    } else {
      setSelectedPayments([...selectedPayments, paymentId])
    }
  }

  const toggleSelectAll = () => {
    if (selectedPayments.length === undepositedFunds?.length) {
      setSelectedPayments([])
    } else {
      setSelectedPayments(undepositedFunds?.map((p: any) => p.id) || [])
    }
  }

  const calculateTotal = () => {
    if (!undepositedFunds) return 0
    return selectedPayments.reduce((total, paymentId) => {
      const payment = undepositedFunds.find((p: any) => p.id === paymentId)
      return total + (payment?.jumlah_bayar || 0)
    }, 0)
  }

  const handleCreateDeposit = () => {
    if (selectedPayments.length === 0) return

    const selectedPaymentData = undepositedFunds.filter((p: any) => selectedPayments.includes(p.id))
    const dates = selectedPaymentData.map((p: any) => new Date(p.tanggal_bayar))
    const periodeAwal = new Date(Math.min(...dates.map((d: Date) => d.getTime())))
    const periodeAkhir = new Date(Math.max(...dates.map((d: Date) => d.getTime())))

    const depositData = {
      tanggal_setor: tanggalSetor,
      jumlah_setor: calculateTotal(),
      periode_awal: periodeAwal.toISOString(),
      periode_akhir: periodeAkhir.toISOString(),
      payment_ids: selectedPayments,
      catatan: catatan || undefined,
    }

    createDepositMutation.mutate(depositData)
  }

  const totalUndeposited = undepositedFunds?.reduce((sum: number, p: any) => sum + p.jumlah_bayar, 0) || 0

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Setoran</h1>
            <p className="text-gray-500 mt-1 text-lg">Kelola setoran dana ke bendahara</p>
          </div>
          <Button
            onClick={() => setCreateModalOpen(true)}
            disabled={!undepositedFunds || undepositedFunds.length === 0}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30"
          >
            <Plus className="w-5 h-5 mr-2" />
            Buat Setoran Baru
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Undeposited Funds Summary & List */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-orange-100 font-medium mb-1">Dana Belum Disetor</p>
                <p className="text-4xl font-extrabold tracking-tight mb-2">{formatCurrency(totalUndeposited)}</p>
                <div className="flex items-center gap-2 text-orange-100 text-sm bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                  <Wallet className="w-4 h-4" />
                  <span>{undepositedFunds?.length || 0} transaksi tunai</span>
                </div>
              </div>
              <Wallet className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-12" />
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col max-h-[600px]">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-500" />
                  Rincian Transaksi
                </h3>
              </div>

              <div className="overflow-y-auto p-4 space-y-3 flex-1">
                {loadingUndeposited ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-100 border-t-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500 text-sm">Memuat data...</p>
                  </div>
                ) : undepositedFunds && undepositedFunds.length > 0 ? (
                  undepositedFunds.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="font-semibold text-gray-900 truncate text-sm">{payment.customer_nama}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">
                            {formatDateTime(payment.tanggal_bayar)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <p className="font-bold text-gray-900 text-sm">{formatCurrency(payment.jumlah_bayar)}</p>
                        <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full uppercase tracking-wider mt-0.5 inline-block">
                          Tunai
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 px-4">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <p className="text-gray-900 font-medium">Semua Beres!</p>
                    <p className="text-sm text-gray-500 mt-1">Tidak ada dana yang perlu disetor saat ini.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Deposits History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden min-h-[500px]">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Riwayat Setoran
                </h2>
              </div>

              <div className="p-6">
                {loadingDeposits ? (
                  <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500 font-medium">Memuat riwayat setoran...</p>
                  </div>
                ) : deposits && deposits.length > 0 ? (
                  <div className="space-y-4">
                    {deposits.map((deposit: any) => (
                      <div key={deposit.id} className="group bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-all duration-200 hover:border-blue-200">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-sm">
                                  Setoran {formatDate(deposit.tanggal_setor)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Periode: {formatDate(deposit.periode_awal)} - {formatDate(deposit.periode_akhir)}
                                </p>
                              </div>
                            </div>

                            {deposit.catatan && (
                              <div className="mt-1.5 ml-10 pl-2 border-l-2 border-gray-200 text-xs text-gray-600 italic">
                                "{deposit.catatan}"
                              </div>
                            )}

                            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 ml-10">
                              <span className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded-md border border-gray-100">
                                <Wallet className="w-3 h-3" />
                                {deposit.payment_ids?.length || 0} transaksi
                              </span>
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end justify-between gap-2">
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Total Disetor</p>
                              <p className="text-lg font-bold text-gray-900">{formatCurrency(deposit.jumlah_setor)}</p>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* Receipt Actions */}
                              <div className="flex gap-1 mr-2 border-r border-gray-200 pr-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-full"
                                  title="Cetak Bukti (Struk)"
                                  onClick={async () => {
                                    try {
                                      const { data: fullDeposit } = await depositsApi.getOne(deposit.id);
                                      setPrintMode('receipt');
                                      setSelectedDepositForPrint(fullDeposit);
                                      await new Promise(r => setTimeout(r, 500));

                                      const receipt = document.getElementById('deposit-receipt');
                                      if (receipt) {
                                        receipt.style.display = 'block';
                                        setTimeout(() => {
                                          window.print();
                                          receipt.style.display = 'none';
                                          setSelectedDepositForPrint(null);
                                          setPrintMode(null);
                                        }, 100);
                                      }
                                    } catch (error) {
                                      console.error('Failed to print receipt:', error);
                                      alert('Gagal memuat detail setoran');
                                    }
                                  }}
                                >
                                  <Printer className="w-4 h-4 text-gray-600" />
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-full"
                                  title="Unduh Bukti PDF"
                                  onClick={async () => {
                                    try {
                                      const { data: fullDeposit } = await depositsApi.getOne(deposit.id);
                                      setPrintMode('receipt');
                                      setSelectedDepositForPrint(fullDeposit);
                                      await new Promise(r => setTimeout(r, 500));

                                      const receipt = document.getElementById('deposit-receipt');
                                      if (receipt) {
                                        receipt.style.display = 'block';
                                        setTimeout(async () => {
                                          const filename = generateBillFilename(`bukti-setor-${formatDate(deposit.tanggal_setor)}`);
                                          await generatePDF('deposit-receipt', filename);
                                          receipt.style.display = 'none';
                                          setSelectedDepositForPrint(null);
                                          setPrintMode(null);
                                        }, 100);
                                      }
                                    } catch (error) {
                                      console.error('Failed to download receipt:', error);
                                      alert('Gagal memuat detail setoran');
                                    }
                                  }}
                                >
                                  <Download className="w-4 h-4 text-gray-600" />
                                </Button>
                              </div>

                              {/* Report Actions */}
                              <div className="flex gap-1">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-full bg-blue-50 hover:bg-blue-100"
                                  title="Cetak Laporan Lengkap"
                                  onClick={async () => {
                                    try {
                                      const { data: fullDeposit } = await depositsApi.getOne(deposit.id);
                                      setPrintMode('report');
                                      setSelectedDepositForPrint(fullDeposit);
                                      await new Promise(r => setTimeout(r, 500));

                                      const report = document.getElementById('deposit-report-print');
                                      if (report) {
                                        report.style.display = 'block';
                                        setTimeout(() => {
                                          window.print();
                                          report.style.display = 'none';
                                          setSelectedDepositForPrint(null);
                                          setPrintMode(null);
                                        }, 100);
                                      }
                                    } catch (error) {
                                      console.error('Failed to print report:', error);
                                      alert('Gagal memuat detail setoran');
                                    }
                                  }}
                                >
                                  <FileText className="w-4 h-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-full bg-blue-50 hover:bg-blue-100"
                                  title="Unduh Laporan PDF"
                                  onClick={async () => {
                                    try {
                                      const { data: fullDeposit } = await depositsApi.getOne(deposit.id);
                                      setPrintMode('report');
                                      setSelectedDepositForPrint(fullDeposit);
                                      await new Promise(r => setTimeout(r, 500));

                                      const report = document.getElementById('deposit-report-print');
                                      if (report) {
                                        report.style.display = 'block';
                                        setTimeout(async () => {
                                          const filename = generateBillFilename(`laporan-setoran-${formatDate(deposit.tanggal_setor)}`);
                                          await generatePDF('deposit-report-print', filename);
                                          report.style.display = 'none';
                                          setSelectedDepositForPrint(null);
                                          setPrintMode(null);
                                        }, 100);
                                      }
                                    } catch (error) {
                                      console.error('Failed to download report:', error);
                                      alert('Gagal memuat detail setoran');
                                    }
                                  }}
                                >
                                  <Download className="w-4 h-4 text-blue-600" />
                                </Button>
                              </div>

                              <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>

                              <Button
                                variant="danger"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full bg-red-50 text-red-600 hover:bg-red-100 border-red-100"
                                title="Batalkan Setoran"
                                onClick={() => {
                                  if (confirm('Yakin ingin membatalkan setoran ini?')) {
                                    cancelDepositMutation.mutate(deposit.id)
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Belum ada riwayat setoran</h3>
                    <p className="text-gray-500 mt-2">Setoran yang Anda buat akan muncul di sini</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Deposit Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Buat Setoran Baru"
        size="lg"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-blue-900">Konfirmasi Setoran</p>
              <p className="text-sm text-blue-700 mt-1">
                Pilih transaksi tunai yang akan disetorkan ke bendahara. Pastikan uang fisik sesuai dengan total yang tertera.
              </p>
            </div>
          </div>

          {/* Payment Selection */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-700 text-sm">Pilih Transaksi</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSelectAll}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 text-xs font-bold uppercase tracking-wider"
              >
                {selectedPayments.length === undepositedFunds?.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
              </Button>
            </div>

            <div className="max-h-[300px] overflow-y-auto p-2 space-y-2 bg-gray-50/30">
              {undepositedFunds?.map((payment: any) => (
                <div
                  key={payment.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${selectedPayments.includes(payment.id)
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  onClick={() => togglePayment(payment.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedPayments.includes(payment.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'
                        }`}>
                        {selectedPayments.includes(payment.id) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{payment.customer_nama}</p>
                        <p className="text-xs text-gray-500">{formatDateTime(payment.tanggal_bayar)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-sm">{formatCurrency(payment.jumlah_bayar)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="deposit-date"
              name="tanggal_setor"
              type="date"
              label="Tanggal Setor"
              value={tanggalSetor}
              onChange={(e: any) => setTanggalSetor(e.target.value)}
            />
            <Input
              id="deposit-note"
              name="catatan"
              label="Catatan (Opsional)"
              value={catatan}
              onChange={(e: any) => setCatatan(e.target.value)}
              placeholder="Contoh: Setoran minggu ke-1"
            />
          </div>

          {/* Summary Footer */}
          <div className="bg-gray-900 text-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400">Transaksi Dipilih</span>
              <span className="font-bold">{selectedPayments.length} item</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-700">
              <span className="text-lg font-medium">Total Setoran</span>
              <span className="text-3xl font-bold text-green-400">{formatCurrency(calculateTotal())}</span>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setCreateModalOpen(false)}
                className="flex-1 bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
              >
                Batal
              </Button>
              <Button
                onClick={handleCreateDeposit}
                disabled={selectedPayments.length === 0}
                isLoading={createDepositMutation.isPending}
                className="flex-[2] bg-green-600 hover:bg-green-700 text-white border-transparent"
              >
                <Wallet className="w-5 h-5 mr-2" />
                Konfirmasi Setoran
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Hidden Deposit Components for Printing */}
      {selectedDepositForPrint && (
        <>
          {/* Old Receipt Style */}
          {printMode === 'receipt' && (
            <DepositReceipt
              deposit={selectedDepositForPrint}
              payments={selectedDepositForPrint.payments || []}
            />
          )}
          {/* New Report Style */}
          {printMode === 'report' && (
            <div className="hidden print:block">
              <DepositReportPrint
                deposit={selectedDepositForPrint}
                payments={selectedDepositForPrint.payments || []}
              />
            </div>
          )}
        </>
      )}
    </AdminLayout>
  )
}

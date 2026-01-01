'use client'

import PortalLayout from '@/components/PortalLayout'
import { useQuery } from '@tanstack/react-query'
import { customersApi } from '@/lib/api'
import { formatCurrency, formatMonth } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import { History, Receipt, TrendingUp, DollarSign, Calendar, FileText, Download, Printer, ChevronDown, CheckCircle, MoreVertical } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { generatePDF } from '@/lib/pdf'
import PaymentReceipt from '@/components/PaymentReceipt'

export default function PortalRiwayatPage() {
  const [customerId, setCustomerId] = useState<string>('')
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setCustomerId(user.id)
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is outside any open dropdown
      if (openDropdown && !event.target) return

      // Use a more generic check since we might have multiple refs or buttons
      const target = event.target as HTMLElement
      if (!target.closest('[data-dropdown-container]')) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openDropdown])

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer-riwayat', customerId],
    queryFn: async () => {
      const { data } = await customersApi.getOne(customerId)
      return data
    },
    enabled: !!customerId,
    retry: 1,
  })

  // Start PDF functions
  const handleDownloadReceipt = async (payment: any, format: 'a4' | 'thermal' | 'compact') => {
    setIsDownloading(payment.id)
    setSelectedPayment(payment)
    setOpenDropdown(null)

    await new Promise(resolve => setTimeout(resolve, 200))

    try {
      const formatName = format === 'a4' ? 'A4' : format === 'thermal' ? 'Thermal' : 'Hemat_Kertas'
      const filename = `Struk_${formatName}_${payment.customer_nama.replace(/\s+/g, '_')}_${new Date(payment.tanggal_bayar).toLocaleDateString('id-ID').replace(/\//g, '-')}.pdf`
      const elementId = `hidden-receipt-${format}-${payment.id}`
      await generatePDF(elementId, filename, { format })
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Gagal mengunduh struk. Silakan coba lagi.')
    } finally {
      setIsDownloading(null)
      setSelectedPayment(null)
    }
  }

  const handlePrintReceipt = (payment: any, format: 'a4' | 'thermal' | 'compact') => {
    setSelectedPayment(payment)
    setOpenDropdown(null)

    setTimeout(() => {
      const elementId = `hidden-receipt-${format}-${payment.id}`
      const receipt = document.getElementById(elementId)
      if (receipt) {
        receipt.style.display = 'block'
        setTimeout(() => {
          window.print()
          receipt.style.display = 'none'
          setSelectedPayment(null)
        }, 100)
      }
    }, 100)
  }
  // End PDF functions

  if (isLoading || !customer) {
    return (
      <PortalLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-32 bg-white rounded-2xl animate-pulse" />
            <div className="h-32 bg-white rounded-2xl animate-pulse" />
          </div>
          <div className="h-96 bg-white rounded-2xl animate-pulse" />
        </div>
      </PortalLayout>
    )
  }

  const payments = customer.payments || []
  const totalPaid = payments.reduce((sum: number, p: any) => sum + p.jumlah_bayar, 0)

  return (
    <PortalLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Receipt className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <p className="text-white font-medium mb-1">Total Transaksi</p>
              <h2 className="text-4xl font-black mb-1 text-white">{payments.length}</h2>
              <p className="text-sm text-white/80">Pembayaran berhasil</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <DollarSign className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <p className="text-white font-medium mb-1">Total Dibayar</p>
              <h2 className="text-4xl font-black mb-1 text-white">{formatCurrency(totalPaid)}</h2>
              <p className="text-sm text-white/80">Akumulasi pembayaran</p>
            </div>
          </div>

          {/* Last Payment Card */}
          {payments.length > 0 && (
            <div className="hidden lg:block bg-white border border-gray-100 rounded-3xl p-6 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">Pembayaran Terakhir</p>
                  <p className="font-bold text-gray-900">
                    {new Date(payments[0].tanggal_bayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success">Lunas</Badge>
                <span className="text-sm text-gray-500">via {payments[0].metode_bayar}</span>
              </div>
            </div>
          )}
        </div>

        {/* History List */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <History className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Riwayat Pembayaran</h2>
          </div>

          {payments.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {payments.map((payment: any) => {
                const bulanDibayar = JSON.parse(payment.bulan_dibayar)
                const isOpen = openDropdown === payment.id

                return (
                  <div key={payment.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group relative">
                    <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">

                      {/* Left Side: Basic Info */}
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            <p className="font-bold text-gray-900 text-lg">
                              {new Date(payment.tanggal_bayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                            <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md border border-gray-200 uppercase">
                              {payment.metode_bayar}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {bulanDibayar.map((month: string) => (
                              <span key={month} className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                {formatMonth(month)}
                              </span>
                            ))}
                          </div>
                          {payment.catatan && (
                            <p className="text-xs text-gray-500 italic flex items-center gap-1">
                              <span className="w-1 h-1 bg-gray-400 rounded-full" />
                              {payment.catatan}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Side: Amount & Actions */}
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 md:gap-4 pl-[4rem] md:pl-0">
                        <p className="text-xl font-black text-gray-900">
                          {formatCurrency(payment.jumlah_bayar)}
                        </p>

                        {/* Dropdown Container */}
                        <div className="relative" data-dropdown-container>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenDropdown(isOpen ? null : payment.id)
                            }}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${isOpen
                              ? 'bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500 ring-opacity-50'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                              }`}
                          >
                            <Printer className="w-4 h-4" />
                            <span>Cetak / Unduh</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Dropdown Menu */}
                          {isOpen && (
                            <div className="absolute right-0 bottom-full mb-2 md:bottom-auto md:top-full md:mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-bottom-right md:origin-top-right">
                              <div className="p-1.5">
                                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 mb-1">
                                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pilih Format</p>
                                </div>

                                <DropdownItem onClick={() => handleDownloadReceipt(payment, 'a4')} icon={Download} label="Download PDF A4" description="Format Standar" />
                                <DropdownItem onClick={() => handleDownloadReceipt(payment, 'thermal')} icon={Download} label="Download Thermal" description="Ukuran 58mm" />

                                <div className="h-px bg-gray-100 my-1" />

                                <DropdownItem onClick={() => handlePrintReceipt(payment, 'thermal')} icon={Printer} label="Print Thermal" description="Cetak Langsung" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <History className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Belum Ada Riwayat</h3>
              <p className="text-gray-500">Transaksi pembayaran Anda akan muncul di sini.</p>
            </div>
          )}
        </div>

        {/* Hidden Components for PDF Generation */}
        {selectedPayment && (
          <>
            <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '210mm' }}>
              <PaymentReceipt payment={selectedPayment} customer={customer} customId={`hidden-receipt-a4-${selectedPayment.id}`} isThermal={false} isCompact={false} />
            </div>
            <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '58mm' }}>
              <PaymentReceipt payment={selectedPayment} customer={customer} customId={`hidden-receipt-thermal-${selectedPayment.id}`} isThermal={true} isCompact={false} />
            </div>
            <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '215.9mm' }}>
              <PaymentReceipt payment={selectedPayment} customer={customer} customId={`hidden-receipt-compact-${selectedPayment.id}`} isThermal={false} isCompact={true} />
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  )
}

function DropdownItem({ onClick, icon: Icon, label, description }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-emerald-50 rounded-lg transition-colors text-left group"
    >
      <div className="mt-0.5 text-gray-400 group-hover:text-emerald-600 transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700 group-hover:text-emerald-700">{label}</p>
        {description && <p className="text-[10px] text-gray-400 group-hover:text-emerald-500/80">{description}</p>}
      </div>
    </button>
  )
}

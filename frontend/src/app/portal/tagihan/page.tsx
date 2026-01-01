'use client'

import PortalLayout from '@/components/PortalLayout'
import { useQuery } from '@tanstack/react-query'
import { customersApi, settingsApi } from '@/lib/api'
import { formatCurrency, formatMonth } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import { Receipt, CheckCircle, AlertCircle, DollarSign, Calendar, Phone, MapPin, CreditCard, Info, Download, MessageCircle, ChevronRight, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { generatePDF } from '@/lib/pdf'
import jsPDF from 'jspdf'
import toast, { Toaster } from 'react-hot-toast'

export default function PortalTagihanPage() {
  const [customerId, setCustomerId] = useState<string>('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setCustomerId(user.id)
    }
  }, [])

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer-tagihan', customerId],
    queryFn: async () => {
      const { data } = await customersApi.getOne(customerId)
      return data
    },
    enabled: !!customerId,
    retry: 1,
  })

  // Get settings for logo
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      try {
        const { data } = await settingsApi.get()
        return data
      } catch (error) {
        return null
      }
    },
  })

  if (isLoading || !customer) {
    return (
      <PortalLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-40 bg-white rounded-3xl animate-pulse" />
            <div className="h-40 bg-white rounded-3xl animate-pulse" />
          </div>
          <div className="h-96 bg-white rounded-3xl animate-pulse" />
        </div>
      </PortalLayout>
    )
  }

  const hasArrears = customer.arrears && customer.arrears.totalArrears > 0

  // Function to download bill summary as PDF
  const handleDownloadBillSummary = async () => {
    if (!customer || !hasArrears) return

    setIsDownloading(true)

    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

      // Header with logo
      // Header with logo
      if (settings?.logo) {
        try {
          // Fetch logo
          const logoUrl = API_URL.replace(/\/api\/?$/, '') + (settings.logo.startsWith('/') ? '' : '/') + settings.logo
          const img = new Image()
          img.src = logoUrl
          // Wait for image to load
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
          })

          // Calculate aspect ratio to fit within 20x20mm box
          const maxSize = 20
          const aspect = img.width / img.height
          let w = maxSize
          let h = maxSize
          if (aspect > 1) {
            h = w / aspect
          } else {
            w = h * aspect
          }

          pdf.addImage(img, 'PNG', 15, 15, w, h)
        } catch (e) {
          console.log('Logo not loaded', e)
        }
      }

      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text(settings?.app_name || 'SABAMAS', 50, 20)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(settings?.app_description || 'Sistem Billing Sampah', 50, 27)

      // Title
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('RINGKASAN TAGIHAN', 15, 50)

      // Customer info
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Nama: ${customer.nama}`, 15, 60)
      pdf.text(`Alamat: ${customer.alamat}`, 15, 67)
      pdf.text(`Wilayah: ${customer.wilayah}`, 15, 74)
      pdf.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 15, 81)

      // Line separator
      pdf.setDrawColor(200, 200, 200)
      pdf.line(15, 88, 195, 88)

      // Arrears list
      let yPos = 98
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Detail Tunggakan:', 15, yPos)

      yPos += 10
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')

      customer.arrears.arrearMonths.forEach((arrear: any, index: number) => {
        if (yPos > 270) {
          pdf.addPage()
          yPos = 20
        }

        pdf.setFont('helvetica', 'bold')
        pdf.text(`${index + 1}. ${formatMonth(arrear.month)}`, 20, yPos)
        pdf.setFont('helvetica', 'normal')
        pdf.text(formatCurrency(arrear.amount), 150, yPos, { align: 'right' })
        pdf.text(`(${arrear.details})`, 25, yPos + 5)

        yPos += 12
      })

      // Total
      yPos += 5
      pdf.setDrawColor(0, 0, 0)
      pdf.line(15, yPos, 195, yPos)
      yPos += 8

      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('TOTAL TUNGGAKAN:', 15, yPos)
      pdf.text(formatCurrency(customer.arrears.totalArrears), 195, yPos, { align: 'right' })

      // Payment info
      yPos += 15
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Informasi Pembayaran:', 15, yPos)

      yPos += 8
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Transfer Bank: BCA - 1234567890 a.n. SABAMAS', 20, yPos)
      yPos += 6
      pdf.text('Bayar Langsung: Jl. Raya Utama No. 123, Kota Bersih', 20, yPos)

      // Download
      const filename = `Tagihan_${customer.nama.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.pdf`
      pdf.save(filename)

    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Gagal mengunduh ringkasan tagihan. Silakan coba lagi.')
    } finally {
      setIsDownloading(false)
    }
  }

  // Function to send payment request via WhatsApp
  const handleWhatsAppPayment = () => {
    if (!customer || !hasArrears) return

    setIsSendingWhatsApp(true)

    const months = customer.arrears.arrearMonths.map((a: any) => formatMonth(a.month)).join(', ')
    const message = encodeURIComponent(
      `Halo, saya ingin melakukan pembayaran tagihan:\n\n` +
      `Nama: ${customer.nama}\n` +
      `No. Pelanggan: ${customer.nomor_pelanggan}\n` +
      `Total Tagihan: ${formatCurrency(customer.arrears.totalArrears)}\n` +
      `Bulan: ${months}\n` +
      `(${customer.arrears.totalMonths} bulan)\n\n` +
      `Mohon informasi cara pembayarannya. Terima kasih!`
    )

    // Replace with actual WhatsApp number
    // Replace with actual WhatsApp number
    const whatsappNumber = '6285867714590'
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank')

    setTimeout(() => setIsSendingWhatsApp(false), 1000)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Disalin ke clipboard!')
  }

  return (
    <PortalLayout>
      <Toaster position="top-center" />
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Header Summary */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Total Arrears Card */}
          <div className="flex-1 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-purple-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <AlertCircle className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <p className="text-purple-100 font-medium mb-1">Total Tunggakan</p>
              <h2 className="text-4xl md:text-5xl font-black mb-2 tracking-tight text-white">
                {formatCurrency(customer.arrears?.totalArrears || 0)}
              </h2>
              <p className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full w-fit backdrop-blur-sm">
                {customer.arrears?.totalMonths || 0} bulan outstanding
              </p>
            </div>
          </div>

          {/* Monthly Rate Card */}
          <div className="flex-1 bg-white border border-gray-100 rounded-3xl p-8 flex flex-col justify-center shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <CreditCard className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <DollarSign className="w-6 h-6" />
                </div>
                <p className="text-gray-500 font-medium">Tarif Bulanan</p>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">
                {formatCurrency(customer.tarif?.harga_per_bulan || 0)}
              </h2>
              <p className="text-emerald-600 font-medium text-sm flex items-center gap-1">
                {customer.tarif?.nama_kategori}
                <ChevronRight className="w-3 h-3" />
              </p>
            </div>
          </div>
        </div>

        {/* Arrears Detail */}
        {hasArrears ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-gray-400" />
                  Rincian Tagihan
                </h3>
                <span className="text-sm text-gray-500">{customer.arrears.arrearMonths.length} Item</span>
              </div>

              <div className="space-y-4">
                {customer.arrears.arrearMonths.map((arrear: any, index: number) => (
                  <div key={index} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-lg text-gray-900">{formatMonth(arrear.month)}</p>
                        <p className="text-sm text-gray-500">{arrear.details}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="warning">{arrear.source}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl text-red-600">{formatCurrency(arrear.amount)}</p>
                      <p className="text-xs text-red-400 font-medium">Belum Dibayar</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-4 mt-8">
                <button
                  onClick={handleDownloadBillSummary}
                  disabled={isDownloading}
                  className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-xl transition-all disabled:opacity-50"
                >
                  {isDownloading ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Unduh Ringkasan (PDF)
                </button>

                <button
                  onClick={handleWhatsAppPayment}
                  disabled={isSendingWhatsApp}
                  className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {isSendingWhatsApp ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <MessageCircle className="w-4 h-4" />
                  )}
                  Konfirmasi Pembayaran (WA)
                </button>
              </div>
            </div>

            {/* Payment Methods Side Panel */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">Metode Pembayaran</h3>

              <div className="bg-white rounded-3xl p-6 border border-blue-100 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -mr-10 -mt-10"></div>

                <div className="relative z-10 space-y-6">
                  {/* Bank Transfer */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-blue-800 font-bold">
                      <CreditCard className="w-5 h-5" />
                      <h4>Transfer Bank</h4>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 group cursor-pointer hover:bg-blue-50/50 transition-colors" onClick={() => copyToClipboard('1380025207999')}>
                      <p className="text-xs text-gray-500 mb-1 font-medium">Bank Mandiri (BUM Des Karya Lestari Manunggal Pengolahan Sampah)</p>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-mono font-bold text-gray-900 tracking-wider">1380 0252 07999</p>
                        <Copy className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-px bg-gray-100" />

                  {/* Cash */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                      <MapPin className="w-5 h-5" />
                      <h4>Bayar Langsung</h4>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Kantor Bumdes Kalem Dukuh Ngumbul RT 02/RW 02<br />
                      Desa Kemasan Kecamatan Sawit Kabupaten Boyolali 57374<br />
                      Provinsi Jawa Tengah
                    </p>
                    <a href="https://wa.me/6285867714590" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:underline">
                      <Phone className="w-4 h-4" />
                      Hubungi Petugas (0858-6771-4590)
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 text-yellow-800 p-4 rounded-2xl text-sm border border-yellow-100 flex gap-3">
                <Info className="w-5 h-5 flex-shrink-0" />
                <p>Harap simpan bukti transfer untuk verifikasi pembayaran yang lebih cepat.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Tagihan Lunas! 🎉</h3>
            <p className="text-gray-500 text-lg">Terima kasih, Anda tidak memiliki tunggakan saat ini.</p>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}

'use client'

import { formatCurrency, formatDateTime, formatMonth } from '@/lib/utils'

interface PrintReceiptProps {
  payment: {
    id: string
    customer_nama: string
    customer?: {
      alamat: string
      wilayah: string
      nomor_telepon?: string
    }
    tanggal_bayar: string
    bulan_dibayar: string[]
    jumlah_bayar: number
    metode_bayar: string
    catatan?: string
  }
}

export function PrintReceipt({ payment }: PrintReceiptProps) {
  return (
    <div className="print:block hidden">
      <div className="max-w-2xl mx-auto p-8 bg-white">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
          <div className="flex items-center justify-center mb-4">
            {/* Dynamic Logo */}
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mr-4 overflow-hidden">
              <img
                src={window.localStorage.getItem('logo_url') || '/logo-placeholder.png'}
                onError={(e) => {
                  // Fallback to default icon if image fails
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.classList.add('bg-primary');
                  e.currentTarget.parentElement!.innerHTML = `
                     <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                     </svg>
                   `;
                }}
                alt="SABAMAS Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SABAMAS</h1>
              <p className="text-sm text-gray-600">Sistem Billing Sampah</p>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">BUKTI PEMBAYARAN</h2>
        </div>

        {/* Receipt Info */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">No. Transaksi</p>
              <p className="font-mono text-sm">{payment.id.substring(0, 13).toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Tanggal & Waktu</p>
              <p className="font-semibold">{formatDateTime(payment.tanggal_bayar)}</p>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold text-gray-900 mb-2">Informasi Pelanggan</h3>
          <div className="space-y-1">
            <p className="text-sm"><span className="text-gray-600">Nama:</span> <span className="font-semibold">{payment.customer_nama}</span></p>
            {payment.customer?.alamat && (
              <p className="text-sm"><span className="text-gray-600">Alamat:</span> {payment.customer.alamat}</p>
            )}
            {payment.customer?.wilayah && (
              <p className="text-sm"><span className="text-gray-600">Wilayah:</span> {payment.customer.wilayah}</p>
            )}
            {payment.customer?.nomor_telepon && (
              <p className="text-sm"><span className="text-gray-600">Telepon:</span> {payment.customer.nomor_telepon}</p>
            )}
          </div>
        </div>

        {/* Payment Details */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Rincian Pembayaran</h3>
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2 text-sm">Periode</th>
                <th className="text-right p-2 text-sm">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {payment.bulan_dibayar.map((month) => (
                <tr key={month} className="border-b">
                  <td className="p-2 text-sm">{formatMonth(month)}</td>
                  <td className="text-right p-2 text-sm">{formatCurrency(payment.jumlah_bayar / payment.bulan_dibayar.length)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="p-2 font-semibold">TOTAL</td>
                <td className="text-right p-2 font-bold text-lg">{formatCurrency(payment.jumlah_bayar)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Payment Method */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Metode Pembayaran</p>
            <p className="font-semibold capitalize">{payment.metode_bayar}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Jumlah Bulan</p>
            <p className="font-semibold">{payment.bulan_dibayar.length} bulan</p>
          </div>
        </div>

        {/* Notes */}
        {payment.catatan && (
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm"><span className="font-semibold">Catatan:</span> {payment.catatan}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t-2 border-gray-300">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-gray-500 mb-1">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
              <p className="text-xs text-gray-500">Terima kasih atas pembayaran Anda</p>
            </div>
            <div className="text-center">
              <div className="w-32 border-t border-gray-400 pt-2 mt-12">
                <p className="text-sm">Petugas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Barcode placeholder */}
        <div className="mt-6 text-center">
          <div className="inline-block p-2 border border-gray-300 rounded">
            <p className="font-mono text-xs">{payment.id}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PrintButton({ onClick }: { onClick: () => void }) {
  const handlePrint = () => {
    onClick()
    setTimeout(() => {
      window.print()
    }, 100)
  }

  return (
    <button
      onClick={handlePrint}
      className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition print:hidden"
    >
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      Cetak Nota
    </button>
  )
}

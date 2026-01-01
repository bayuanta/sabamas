'use client'

import AdminLayout from '@/components/AdminLayout'
import { useQuery } from '@tanstack/react-query'
import { customersApi, paymentsApi, depositsApi, tariffsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Download, Database, FileText, Users, Receipt, AlertCircle, CheckCircle, FileSpreadsheet, HardDrive } from 'lucide-react'

export default function BackupPage() {
  const { data: customers, isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers-all'],
    queryFn: async () => {
      const { data } = await customersApi.getAll({ limit: 1000 })
      return data
    },
  })

  const { data: payments, isLoading: loadingPayments } = useQuery({
    queryKey: ['payments-all'],
    queryFn: async () => {
      const { data } = await paymentsApi.getAll({ limit: 1000 })
      return data
    },
  })

  const { data: deposits } = useQuery({
    queryKey: ['deposits-all'],
    queryFn: async () => {
      const { data } = await depositsApi.getAll()
      return data
    },
  })

  const { data: tariffs } = useQuery({
    queryKey: ['tariffs-all'],
    queryFn: async () => {
      const { data } = await tariffsApi.getCategories()
      return data
    },
  })

  const handleExportJSON = () => {
    const data = {
      customers: customers?.data || [],
      payments: payments?.data || [],
      deposits: deposits || [],
      tariffs: tariffs || [],
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sabamas-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = (type: string) => {
    let csvContent = ''
    let filename = ''

    if (type === 'customers' && customers?.data) {
      csvContent = 'ID,Nama,Alamat,Wilayah,Nomor Telepon,Status,Tunggakan\n'
      customers.data.forEach((c: any) => {
        csvContent += `${c.id},${c.nama},${c.alamat},${c.wilayah},${c.nomor_telepon || ''},${c.status},${c.tunggakan || 0}\n`
      })
      filename = 'customers.csv'
    } else if (type === 'payments' && payments?.data) {
      csvContent = 'ID,Customer,Tanggal,Jumlah,Metode\n'
      payments.data.forEach((p: any) => {
        csvContent += `${p.id},${p.customer_nama},${p.tanggal_bayar},${p.jumlah_bayar},${p.metode_bayar}\n`
      })
      filename = 'payments.csv'
    }

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const totalCustomers = customers?.data?.length || 0
  const totalPayments = payments?.data?.length || 0
  const totalAmount = payments?.data?.reduce((sum: number, p: any) => sum + p.jumlah_bayar, 0) || 0
  const totalTunggakan = customers?.data?.reduce((sum: number, c: any) => sum + (c.tunggakan || 0), 0) || 0

  const isLoading = loadingCustomers || loadingPayments

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Backup & Export</h1>
            <p className="text-gray-500 mt-1 text-lg">Amankan data Anda dengan backup rutin</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-20 h-20 text-blue-600" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 text-blue-600">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Pelanggan</p>
              <p className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {isLoading ? '...' : totalCustomers}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Receipt className="w-20 h-20 text-indigo-600" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 text-indigo-600">
                <Receipt className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Transaksi</p>
              <p className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {isLoading ? '...' : totalPayments}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <FileText className="w-20 h-20 text-green-600" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4 text-green-600">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Pemasukan</p>
              <p className="text-2xl font-extrabold text-green-600 tracking-tight">
                {isLoading ? '...' : formatCurrency(totalAmount)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <AlertCircle className="w-20 h-20 text-red-600" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4 text-red-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Tunggakan</p>
              <p className="text-2xl font-extrabold text-red-600 tracking-tight">
                {isLoading ? '...' : formatCurrency(totalTunggakan)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Export Options */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-500" />
                  Pilihan Export
                </h3>
              </div>

              <div className="p-6 space-y-4">
                {/* Full Backup */}
                <div className="group border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0 group-hover:scale-110 transition-transform">
                        <HardDrive className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">Full Backup System (JSON)</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Backup lengkap seluruh database termasuk pelanggan, pembayaran, dan pengaturan.
                          Gunakan file ini untuk restore sistem jika terjadi masalah.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleExportJSON}
                      className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 whitespace-nowrap"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download Backup
                    </Button>
                  </div>
                </div>

                {/* Customers CSV */}
                <div className="group border border-gray-200 rounded-xl p-5 hover:border-green-300 hover:shadow-md transition-all duration-200 bg-white">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 flex-shrink-0 group-hover:scale-110 transition-transform">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">Data Pelanggan (CSV)</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Export daftar pelanggan ke format CSV yang bisa dibuka di Microsoft Excel.
                          Cocok untuk analisis data manual atau laporan.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => handleExportCSV('customers')}
                      className="bg-white hover:bg-green-50 text-green-700 border-green-200 whitespace-nowrap"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>

                {/* Payments CSV */}
                <div className="group border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all duration-200 bg-white">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0 group-hover:scale-110 transition-transform">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">Data Pembayaran (CSV)</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Export riwayat transaksi ke format CSV.
                          Berguna untuk rekapitulasi keuangan bulanan atau audit.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => handleExportCSV('payments')}
                      className="bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200 whitespace-nowrap"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tutorial Section */}
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-500" />
                  Tutorial Backup & Restore
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</div>
                    Cara Backup Data (Export)
                  </h4>
                  <ul className="list-disc list-inside text-gray-600 ml-8 space-y-1 text-sm">
                    <li>Pilih jenis export yang diinginkan di atas (JSON atau CSV).</li>
                    <li>Klik tombol <strong>Download/Export</strong>.</li>
                    <li>File akan otomatis terunduh ke perangkat Anda.</li>
                    <li>Simpan file tersebut di tempat yang aman (Google Drive/Harddisk External).</li>
                  </ul>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">2</div>
                    Cara Restore Data (Import)
                  </h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 mb-3 ml-8">
                    Database: Saat ini fitur import otomatis via website belum tersedia demi keamanan.
                  </div>
                  <ul className="list-disc list-inside text-gray-600 ml-8 space-y-1 text-sm">
                    <li>Siapkan file <strong>.json</strong> atau <strong>.sql</strong> backup terakhir Anda.</li>
                    <li>Hubungi tim teknis/developer untuk melakukan restore database.</li>
                    <li>Serahkan file backup tersebut kepada tim teknis.</li>
                    <li>Tim teknis akan mengupload data tersebut langsung ke server database.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Info Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/30 p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Database className="w-32 h-32 text-white" />
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6" />
                  Tips Keamanan Data
                </h3>
                <ul className="space-y-4 text-blue-100">
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 font-bold text-sm">1</div>
                    <p className="text-sm leading-relaxed">Lakukan backup data secara berkala, minimal seminggu sekali untuk mencegah kehilangan data.</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 font-bold text-sm">2</div>
                    <p className="text-sm leading-relaxed">Simpan file backup di lokasi yang aman dan terpisah dari komputer server (misal: Google Drive).</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 font-bold text-sm">3</div>
                    <p className="text-sm leading-relaxed">Gunakan format JSON untuk restore data ke sistem jika diperlukan.</p>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6">
              <h4 className="font-bold text-gray-900 mb-2">Status Sistem</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Status Database</span>
                  <span className="text-green-600 font-bold flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Terhubung
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Versi Aplikasi</span>
                  <span className="text-gray-900 font-bold">v1.0.0</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Terakhir Backup</span>
                  <span className="text-gray-900 font-bold">-</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

'use client'

import AdminLayout from '@/components/AdminLayout'
import { useQuery } from '@tanstack/react-query'
import { customersApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'
import { Search, Plus, MapPin, Filter, ArrowRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('')
  const [wilayah, setWilayah] = useState<string>('')
  const [page, setPage] = useState(1)
  const limit = 20

  // Fetch wilayah list
  const { data: wilayahList } = useQuery({
    queryKey: ['wilayah-list'],
    queryFn: async () => {
      const { data } = await customersApi.getWilayahList()
      return data
    },
  })

  // Reset page when filters change
  const handleFilterChange = (setter: (val: any) => void, val: any) => {
    setter(val)
    setPage(1)
  }

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customers', { search, status, wilayah, page }],
    queryFn: async () => {
      // Filter out empty strings to avoid 400 Bad Request errors from backend validation
      const params = {
        search: search || undefined,
        status: status || undefined,
        wilayah: wilayah || undefined,
        page,
        limit
      }
      const { data } = await customersApi.getAll(params)
      return data
    },
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pelanggan</h1>
            <p className="text-gray-500 text-sm mt-1">Kelola data pelanggan, tagihan, dan status layanan.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <Link
              href="/customers/new"
              className="inline-flex items-center justify-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all shadow-sm gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pelanggan</span>
            </Link>
          </div>
        </div>

        {/* Filters & Actions Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                id="search-customer"
                name="search"
                placeholder="Cari pelanggan..."
                value={search}
                onChange={(e) => handleFilterChange(setSearch, e.target.value)}
                className="block w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Filters Group */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 min-w-[140px] md:flex-none">
                <select
                  id="filter-wilayah"
                  name="wilayah"
                  value={wilayah}
                  onChange={(e) => handleFilterChange(setWilayah, e.target.value)}
                  className="appearance-none block w-full pl-3 pr-10 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Semua Wilayah</option>
                  {wilayahList?.map((w: string) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <MapPin className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="relative flex-1 min-w-[140px] md:flex-none">
                <select
                  id="filter-status"
                  name="status"
                  value={status}
                  onChange={(e) => handleFilterChange(setStatus, e.target.value)}
                  className="appearance-none block w-full pl-3 pr-10 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Semua Status</option>
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
              <p className="text-gray-500 text-sm">Memuat data pelanggan...</p>
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-4 py-3 text-sm font-bold text-black uppercase tracking-wider">No. Pelanggan</th>
                      <th className="px-4 py-3 text-sm font-bold text-black uppercase tracking-wider">Pelanggan</th>
                      <th className="px-4 py-3 text-sm font-bold text-black uppercase tracking-wider">Alamat</th>
                      <th className="px-4 py-3 text-sm font-bold text-black uppercase tracking-wider">Wilayah</th>
                      <th className="px-4 py-3 text-sm font-bold text-black uppercase tracking-wider">Tarif</th>
                      <th className="px-4 py-3 text-sm font-bold text-black uppercase tracking-wider">Tagihan</th>
                      <th className="px-4 py-3 text-sm font-bold text-black uppercase tracking-wider text-center">Status</th>
                      <th className="px-4 py-3 text-sm font-bold text-black uppercase tracking-wider text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.data.map((customer: any) => (
                      <tr
                        key={customer.id}
                        className="group hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-gray-600 font-medium">
                            {customer.nomor_pelanggan}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs border border-gray-200">
                              {customer.nama.charAt(0).toUpperCase()}
                            </div>
                            <div className="font-bold text-gray-900 text-sm">
                              {customer.nama}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-700 truncate max-w-[180px]" title={customer.alamat}>
                            {customer.alamat}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            {customer.wilayah}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.tarif?.nama_kategori || '-'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {customer.tarif?.harga_per_bulan ? formatCurrency(customer.tarif.harga_per_bulan) : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {customer.tunggakan > 0 ? (
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-red-600">
                                {formatCurrency(customer.tunggakan)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-emerald-600">
                              Lunas
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border ${customer.status === 'aktif'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                            }`}>
                            {customer.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/customers/${customer.id}`}
                            className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data?.meta && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Showing <span className="font-medium text-gray-900">{((page - 1) * limit) + 1}</span> to <span className="font-medium text-gray-900">{Math.min(page * limit, data.meta.total)}</span> of <span className="font-medium text-gray-900">{data.meta.total}</span> results
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-sm transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(data.meta.totalPages, p + 1))}
                      disabled={page >= data.meta.totalPages}
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-sm transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada pelanggan ditemukan</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-6">
                Coba sesuaikan filter pencarian atau tambahkan data pelanggan baru.
              </p>
              <button
                onClick={() => {
                  setSearch('')
                  setStatus('')
                  setWilayah('')
                }}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

'use client'

import PortalLayout from '@/components/PortalLayout'
import { useQuery } from '@tanstack/react-query'
import { customersApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { AlertCircle, DollarSign, Calendar, User } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function PortalDashboardPage() {
  const [customerId, setCustomerId] = useState<string>('')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setCustomerId(user.id)
    }
  }, [])

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer-portal', customerId],
    queryFn: async () => {
      const { data } = await customersApi.getOne(customerId)
      return data
    },
    enabled: !!customerId,
  })

  if (isLoading || !customer) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data...</p>
          </div>
        </div>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Selamat Datang, {customer.nama}!</h2>
          <p className="text-blue-100">Portal Pelanggan SABAMAS</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Tunggakan</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(customer.arrears?.totalArrears || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {customer.arrears?.totalMonths || 0} bulan
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Tarif Bulanan</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(customer.tarif?.harga_per_bulan || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{customer.tarif?.nama_kategori}</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <Badge variant="success" className="text-base px-3 py-1 mt-2">
                {customer.status}
              </Badge>
              <p className="text-xs text-gray-500 mt-2">
                Sejak {new Date(customer.tanggal_bergabung).toLocaleDateString('id-ID')}
              </p>
            </div>
          </Card>
        </div>

        {/* Info Pelanggan */}
        <Card title="Informasi Pelanggan">
          <div className="space-y-4">
            <div className="flex items-start">
              <User className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Nama Lengkap</p>
                <p className="font-semibold text-gray-900">{customer.nama}</p>
              </div>
            </div>
            <div className="flex items-start">
              <svg className="w-5 h-5 text-gray-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p className="text-sm text-gray-600">Alamat</p>
                <p className="font-semibold text-gray-900">{customer.alamat}</p>
                <p className="text-sm text-gray-500">{customer.wilayah}</p>
              </div>
            </div>
            {customer.nomor_telepon && (
              <div className="flex items-start">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-600">Nomor Telepon</p>
                  <p className="font-semibold text-gray-900">{customer.nomor_telepon}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Alert if has arrears */}
        {customer.arrears && customer.arrears.totalArrears > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-900">Anda memiliki tunggakan</h4>
                <p className="text-sm text-red-700 mt-1">
                  Segera lakukan pembayaran untuk {customer.arrears.totalMonths} bulan tunggakan sebesar {formatCurrency(customer.arrears.totalArrears)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}
